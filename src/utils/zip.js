import JSZip from 'jszip';

/**
 * Client-side ZIP creation using JSZip.
 * Generates standards-compliant PKZip archives fully compatible with:
 * - Windows File Explorer built-in zip extractor
 * - Windows PowerShell Expand-Archive
 * - WinRAR, 7-Zip, PeaZip
 * - macOS Archive Utility
 * - Linux unzip command
 *
 * @param {Array<{ name: string, blob: Blob }>} files
 * @param {string} [_zipFilename='converted-images.zip']
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<Blob>}
 */
export async function createZipBlob(files, _zipFilename = 'converted-images.zip', onProgress = null) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided to create ZIP archive.');
  }

  const validFiles = files.filter((f) => f && f.blob);
  if (validFiles.length === 0) {
    throw new Error('No valid file blobs available for ZIP packaging.');
  }

  const zip = new JSZip();
  const usedNames = new Set();

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    let name = (file.name || `image-${i + 1}`).trim();

    // Sanitize filename for ZIP filesystem (strip Windows/Unix illegal characters)
    name = name.replace(/[\\/:*?"<>|]/g, '_');

    // Deduplicate file names to prevent collisions inside the zip archive
    if (usedNames.has(name)) {
      const dotIdx = name.lastIndexOf('.');
      const base = dotIdx !== -1 ? name.slice(0, dotIdx) : name;
      const ext = dotIdx !== -1 ? name.slice(dotIdx) : '';
      let counter = 1;
      while (usedNames.has(`${base}-${counter}${ext}`)) {
        counter++;
      }
      name = `${base}-${counter}${ext}`;
    }
    usedNames.add(name);

    // Add file blob with binary flag and standard DOS timestamp
    zip.file(name, file.blob, {
      binary: true,
      date: new Date(),
    });
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      mimeType: 'application/zip',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    },
    (metadata) => {
      if (typeof onProgress === 'function') {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}
