/**
 * Client-side ZIP creation using native CompressionStream.
 * No external dependencies required.
 */

/**
 * Create a ZIP file from an array of files using the ZIP archive format.
 * Uses native CompressionStream with deflate compression.
 *
 * @param {Array<{ name: string, blob: Blob }>} files
 * @param {string} [zipFilename='converted-images.zip']
 * @returns {Promise<Blob>}
 */
export async function createZipBlob(files, _zipFilename = 'converted-images.zip') {
  if (!files || files.length === 0) {
    throw new Error('No files to zip.');
  }

  if (typeof CompressionStream === 'undefined') {
    throw new Error('ZIP creation is not supported in this browser.');
  }

  const encoder = new TextEncoder();
  const chunks = [];

  const fileEntries = [];
  const centralDirRecords = [];

  for (const file of files) {
    const name = file.name || 'file';
    const blob = file.blob;
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const crc = crc32(bytes);
    const compressed = await compressDeflate(bytes);
    const compressedSize = compressed.length;

    const fileNameBytes = encoder.encode(name);

    const localHeader = new ArrayBuffer(30 + fileNameBytes.length);
    const localView = new DataView(localHeader);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 8, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, compressedSize, true);
    localView.setUint32(22, bytes.length, true);
    localView.setUint16(26, fileNameBytes.length, true);
    localView.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(fileNameBytes);

    chunks.push(new Uint8Array(localHeader));
    chunks.push(compressed);

    const centralOffset = chunks.reduce((acc, chunk) => acc + chunk.length, 0);

    const centralHeader = new ArrayBuffer(46 + fileNameBytes.length);
    const centralView = new DataView(centralHeader);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 8, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, compressedSize, true);
    centralView.setUint32(24, bytes.length, true);
    centralView.setUint16(28, fileNameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, centralOffset, true);
    new Uint8Array(centralHeader, 46).set(fileNameBytes);

    centralDirRecords.push(new Uint8Array(centralHeader));
    fileEntries.push({ name, crc, compressedSize, originalSize: bytes.length });
  }

  const centralDirOffset = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  for (const record of centralDirRecords) {
    chunks.push(record);
  }

  const centralDirSize = centralDirRecords.reduce((acc, record) => acc + record.length, 0);

  const endOfCentralDir = new ArrayBuffer(22);
  const endView = new DataView(endOfCentralDir);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirSize, true);
  endView.setUint32(16, centralDirOffset, true);
  endView.setUint16(20, 0, true);

  chunks.push(new Uint8Array(endOfCentralDir));

  return new Blob(chunks, { type: 'application/zip' });

  async function compressDeflate(data) {
    const stream = new CompressionStream('deflate');
    const writer = stream.writable.getWriter();
    writer.write(data);
    writer.close();
    const reader = stream.readable.getReader();
    const compressedChunks = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      compressedChunks.push(value);
    }
    const totalLength = compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of compressedChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  function crc32(data) {
    let crc = 0xffffffff;
    const table = crc32Table;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
}

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
})();
