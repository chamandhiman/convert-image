/**
 * Client-side image metadata inspector.
 *
 * Reliably inspects EXIF and container metadata from JPEG, PNG, and WebP images
 * using ArrayBuffer and DataView.
 *
 * Categorizes findings into:
 * - GPS / location information
 * - Camera / device information
 * - Date / time information
 * - Orientation information
 * - Software / author information
 *
 * Never fabricates or guesses metadata. If a category is not present or not
 * detectable, it is marked as 'not_detected'.
 */

/** Helper to extract ASCII string from DataView */
function getString(view, offset, length) {
  let str = '';
  for (let i = 0; i < length; i++) {
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break; // Null terminator
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

/** Helper to read rational value (numerator / denominator) */
function getRational(view, offset, isLittle) {
  const num = view.getUint32(offset, isLittle);
  const den = view.getUint32(offset + 4, isLittle);
  if (den === 0) return 0;
  return num / den;
}

/**
 * Parse standard TIFF IFD entries.
 *
 * @param {DataView} view
 * @param {number} tiffStart Absolute byte offset where TIFF header begins
 * @param {number} ifdOffset Relative offset from tiffStart to the IFD
 * @param {boolean} isLittle Endianness (true = Little Endian II, false = Big Endian MM)
 * @returns {object} Extracted metadata map
 */
function parseIFD(view, tiffStart, ifdOffset, isLittle) {
  const tags = {};
  const ifdAbsOffset = tiffStart + ifdOffset;

  if (ifdAbsOffset + 2 > view.byteLength) return tags;
  const numEntries = view.getUint16(ifdAbsOffset, isLittle);

  let curOffset = ifdAbsOffset + 2;

  for (let i = 0; i < numEntries; i++) {
    if (curOffset + 12 > view.byteLength) break;

    const tagId = view.getUint16(curOffset, isLittle);
    const type = view.getUint16(curOffset + 2, isLittle);
    const count = view.getUint32(curOffset + 4, isLittle);
    const valueOffset = view.getUint32(curOffset + 8, isLittle);

    // Read string values (type 2)
    if (type === 2) {
      let strOffset = curOffset + 8;
      if (count > 4) {
        strOffset = tiffStart + valueOffset;
      }
      if (strOffset + count <= view.byteLength) {
        tags[tagId] = getString(view, strOffset, count);
      }
    }
    // Read 16-bit unsigned ints (type 3)
    else if (type === 3) {
      tags[tagId] = view.getUint16(curOffset + 8, isLittle);
    }
    // Read 32-bit unsigned ints (type 4)
    else if (type === 4) {
      tags[tagId] = valueOffset;
    }
    // Read 64-bit rationals (type 5)
    else if (type === 5) {
      const ratOffset = tiffStart + valueOffset;
      if (ratOffset + 8 <= view.byteLength) {
        tags[tagId] = getRational(view, ratOffset, isLittle);
      }
    }

    curOffset += 12;
  }

  return tags;
}

/**
 * Parse GPS Sub-IFD.
 */
function parseGPS(view, tiffStart, gpsOffset, isLittle) {
  const gpsTags = {};
  const absOffset = tiffStart + gpsOffset;
  if (absOffset + 2 > view.byteLength) return gpsTags;

  const numEntries = view.getUint16(absOffset, isLittle);
  let curOffset = absOffset + 2;

  for (let i = 0; i < numEntries; i++) {
    if (curOffset + 12 > view.byteLength) break;

    const tagId = view.getUint16(curOffset, isLittle);
    const valueOffset = view.getUint32(curOffset + 8, isLittle);

    if (tagId === 1 || tagId === 3) {
      // Latitude / Longitude Ref ('N', 'S', 'E', 'W')
      gpsTags[tagId] = String.fromCharCode(view.getUint8(curOffset + 8));
    } else if (tagId === 2 || tagId === 4) {
      // Latitude / Longitude (Array of 3 rationals: degrees, minutes, seconds)
      const dataOffset = tiffStart + valueOffset;
      if (dataOffset + 24 <= view.byteLength) {
        const deg = getRational(view, dataOffset, isLittle);
        const min = getRational(view, dataOffset + 8, isLittle);
        const sec = getRational(view, dataOffset + 16, isLittle);
        gpsTags[tagId] = { deg, min, sec };
      }
    } else if (tagId === 6) {
      // Altitude
      const dataOffset = tiffStart + valueOffset;
      if (dataOffset + 8 <= view.byteLength) {
        gpsTags[tagId] = getRational(view, dataOffset, isLittle);
      }
    }

    curOffset += 12;
  }

  return gpsTags;
}

/**
 * Parse EXIF buffer starting from standard TIFF header (II or MM).
 *
 * @param {DataView} view
 * @param {number} tiffStart
 * @returns {object} Extracted structured tags
 */
function parseTiffHeader(view, tiffStart) {
  if (tiffStart + 8 > view.byteLength) return null;

  const byteOrder = view.getUint16(tiffStart, false);
  const isLittle = byteOrder === 0x4949; // 'II'

  // Confirm TIFF magic number (42)
  const magic = view.getUint16(tiffStart + 2, isLittle);
  if (magic !== 0x002a) return null;

  const firstIfdOffset = view.getUint32(tiffStart + 4, isLittle);
  const mainTags = parseIFD(view, tiffStart, firstIfdOffset, isLittle);

  // Sub-IFD pointers
  let subTags = {};
  if (mainTags[0x8769]) {
    subTags = parseIFD(view, tiffStart, mainTags[0x8769], isLittle);
  }

  // GPS IFD pointer
  let gpsTags = {};
  if (mainTags[0x8825]) {
    gpsTags = parseGPS(view, tiffStart, mainTags[0x8825], isLittle);
  }

  return { mainTags, subTags, gpsTags };
}

/**
 * Scan JPEG buffer for APP1 (0xFFE1) EXIF segment.
 */
function inspectJpeg(view) {
  if (view.byteLength < 4) return null;
  // Check JPEG SOI (0xFFD8)
  if (view.getUint16(0, false) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffda || marker === 0xffd9) {
      // Start of scan or end of image
      break;
    }

    const length = view.getUint16(offset, false);

    if (marker === 0xffe1 && length >= 8) {
      // APP1 Marker
      const headerStr = getString(view, offset + 2, 4);
      if (headerStr === 'Exif') {
        const tiffStart = offset + 8;
        return parseTiffHeader(view, tiffStart);
      }
    }

    offset += length;
  }

  return null;
}

/**
 * Scan PNG buffer for eXIf or text chunks.
 */
function inspectPng(view) {
  if (view.byteLength < 8) return null;
  // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (view.getUint32(0, false) !== 0x89504e47) return null;

  let offset = 8;
  let textChunks = [];

  while (offset + 8 <= view.byteLength) {
    const length = view.getUint32(offset, false);
    const type = getString(view, offset + 4, 4);
    const dataOffset = offset + 8;

    if (type === 'eXIf' && length >= 8) {
      const tiffData = parseTiffHeader(view, dataOffset);
      if (tiffData) return tiffData;
    }

    if ((type === 'tEXt' || type === 'zTXt' || type === 'iTXt') && length > 0) {
      const text = getString(view, dataOffset, Math.min(length, 120));
      if (text) textChunks.push(text);
    }

    if (type === 'IEND') break;

    offset += 12 + length;
  }

  if (textChunks.length > 0) {
    return {
      mainTags: {
        0x0131: textChunks.join('; '),
      },
      subTags: {},
      gpsTags: {},
    };
  }

  return null;
}

/**
 * Scan WebP buffer for EXIF chunk.
 */
function inspectWebP(view) {
  if (view.byteLength < 12) return null;
  // RIFF .... WEBP
  if (getString(view, 0, 4) !== 'RIFF' || getString(view, 8, 4) !== 'WEBP') {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= view.byteLength) {
    const fourCC = getString(view, offset, 4);
    const length = view.getUint32(offset + 4, true); // RIFF is little-endian
    const dataOffset = offset + 8;

    if (fourCC === 'EXIF' && length >= 8) {
      let tiffStart = dataOffset;
      // Some WebP encoders prepend 'Exif\0\0'
      if (getString(view, dataOffset, 4) === 'Exif') {
        tiffStart = dataOffset + 6;
      }
      return parseTiffHeader(view, tiffStart);
    }

    offset += 8 + length + (length % 2); // Pad to even byte
  }

  return null;
}

/**
 * Inspect an image file and return structured privacy metadata findings.
 *
 * @param {File | Blob} file
 * @returns {Promise<object>}
 */
export async function inspectImageMetadata(file) {
  const result = {
    hasMetadata: false,
    summary: 'No metadata detected in this file.',
    categories: {
      gps: { status: 'not_detected', label: 'Location & GPS', details: [] },
      camera: { status: 'not_detected', label: 'Camera & Device', details: [] },
      dateTime: { status: 'not_detected', label: 'Date & Time', details: [] },
      orientation: { status: 'not_detected', label: 'Orientation', details: [] },
      software: { status: 'not_detected', label: 'Software & Author', details: [] },
    },
    rawTagsCount: 0,
    inspectionScope: 'Standard EXIF markers and container metadata inspected.',
  };

  try {
    // Read up to first 256 KB where headers and metadata segments reside
    const maxReadBytes = Math.min(file.size, 256 * 1024);
    const slice = file.slice(0, maxReadBytes);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    let parsed = null;
    const fileType = file.type || '';
    const fileName = (file.name || '').toLowerCase();

    if (fileType === 'image/jpeg' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      parsed = inspectJpeg(view);
    } else if (fileType === 'image/png' || fileName.endsWith('.png')) {
      parsed = inspectPng(view);
    } else if (fileType === 'image/webp' || fileName.endsWith('.webp')) {
      parsed = inspectWebP(view);
    } else {
      result.summary = 'Container metadata inspection is not applicable for this format.';
      result.inspectionScope = 'Format does not store standard EXIF headers.';
      return result;
    }

    if (!parsed) {
      return result;
    }

    const { mainTags = {}, subTags = {}, gpsTags = {} } = parsed;
    let detectedCount = 0;

    // 1. GPS Category
    if (Object.keys(gpsTags).length > 0 || mainTags[0x8825]) {
      const details = [];
      if (gpsTags[2] && gpsTags[1]) {
        details.push(
          `Latitude: ${gpsTags[2].deg}°${gpsTags[2].min}'${Math.round(gpsTags[2].sec)}" ${gpsTags[1]}`,
        );
      }
      if (gpsTags[4] && gpsTags[3]) {
        details.push(
          `Longitude: ${gpsTags[4].deg}°${gpsTags[4].min}'${Math.round(gpsTags[4].sec)}" ${gpsTags[3]}`,
        );
      }
      if (gpsTags[6] !== undefined) {
        details.push(`Altitude: ${Math.round(gpsTags[6])}m`);
      }
      if (details.length === 0) {
        details.push('GPS positioning tags present in EXIF block');
      }

      result.categories.gps.status = 'detected';
      result.categories.gps.details = details;
      detectedCount += details.length;
    }

    // 2. Camera Category
    const make = mainTags[0x010f];
    const model = mainTags[0x0110];
    const lens = subTags[0xa434];
    const cameraDetails = [];
    if (make) cameraDetails.push(`Make: ${make}`);
    if (model) cameraDetails.push(`Model: ${model}`);
    if (lens) cameraDetails.push(`Lens: ${lens}`);

    if (cameraDetails.length > 0) {
      result.categories.camera.status = 'detected';
      result.categories.camera.details = cameraDetails;
      detectedCount += cameraDetails.length;
    }

    // 3. Date & Time Category
    const dateTime = mainTags[0x0132];
    const dateTimeOrig = subTags[0x9003];
    const dateTimeDigitized = subTags[0x9004];
    const dateDetails = [];
    if (dateTimeOrig) dateDetails.push(`Captured: ${dateTimeOrig}`);
    else if (dateTime) dateDetails.push(`Date: ${dateTime}`);
    if (dateTimeDigitized && dateTimeDigitized !== dateTimeOrig) {
      dateDetails.push(`Digitized: ${dateTimeDigitized}`);
    }

    if (dateDetails.length > 0) {
      result.categories.dateTime.status = 'detected';
      result.categories.dateTime.details = dateDetails;
      detectedCount += dateDetails.length;
    }

    // 4. Orientation Category
    const orientation = mainTags[0x0112];
    if (orientation !== undefined && orientation > 1) {
      result.categories.orientation.status = 'detected';
      result.categories.orientation.details = [`EXIF Orientation tag: ${orientation}`];
      detectedCount += 1;
    }

    // 5. Software & Author Category
    const software = mainTags[0x0131];
    const artist = mainTags[0x013b];
    const copyright = mainTags[0x8298];
    const softDetails = [];
    if (software) softDetails.push(`Software: ${software}`);
    if (artist) softDetails.push(`Artist/Author: ${artist}`);
    if (copyright) softDetails.push(`Copyright: ${copyright}`);

    if (softDetails.length > 0) {
      result.categories.software.status = 'detected';
      result.categories.software.details = softDetails;
      detectedCount += softDetails.length;
    }

    result.rawTagsCount = detectedCount;
    result.hasMetadata = detectedCount > 0;

    if (result.hasMetadata) {
      const parts = [];
      if (result.categories.gps.status === 'detected') parts.push('GPS location');
      if (result.categories.camera.status === 'detected') parts.push('camera details');
      if (result.categories.dateTime.status === 'detected') parts.push('timestamps');
      result.summary = `${parts.join(', ')} detected in this image.`;
    }

    return result;
  } catch {
    // If parsing encounters an unexpected buffer issue, return safe uncorrupted result
    return result;
  }
}
