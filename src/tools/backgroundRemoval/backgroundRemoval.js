/**
 * Client-side background removal engine using @imgly/background-removal.
 *
 * Uses ONNX runtime and WebAssembly to isolate foreground subjects and output
 * transparent PNGs completely within the browser.
 */

let removeBackgroundFn = null;

/**
 * Dynamically import the background-removal library so it is only loaded
 * when the user visits the tool or begins processing.
 */
async function loadRemovalEngine() {
  if (!removeBackgroundFn) {
    const module = await import('@imgly/background-removal');
    removeBackgroundFn = module.removeBackground || module.default;
  }
  return removeBackgroundFn;
}

/**
 * Remove the background from an image file/blob client-side.
 *
 * @param {File|Blob|string} imageSource File, Blob, or URL of the image
 * @param {object} [options={}]
 * @param {(progress: { stage: 'loading-model'|'processing'|'complete', percent: number, message: string }) => void} [options.onProgress]
 * @returns {Promise<Blob>} Transparent PNG blob
 */
export async function removeImageBackground(imageSource, { onProgress } = {}) {
  const remover = await loadRemovalEngine();

  if (onProgress) {
    onProgress({
      stage: 'loading-model',
      percent: 0,
      message: 'Connecting to AI model CDN…',
    });
  }

  // Enforce a 90-second timeout so the UI never hangs indefinitely
  const MODEL_TIMEOUT_MS = 90000;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          "Couldn't load the background-removal model. Connection to the model server timed out."
        )
      );
    }, MODEL_TIMEOUT_MS);
  });

  const publicPath =
    typeof window !== 'undefined' && window.location
      ? `${window.location.origin}/imgly/`
      : '/imgly/';

  try {
    const removalPromise = remover(imageSource, {
      publicPath,
      model: 'isnet_quint8',
      proxyToWorker: false,
      debug: false,
      output: {
        format: 'image/png',
        quality: 1,
      },
      progress: (key, current, total) => {
        if (!onProgress) return;

        let percent = 0;
        if (total > 0) {
          percent = Math.min(100, Math.round((current / total) * 100));
        } else if (current >= 0 && current <= 1) {
          percent = Math.min(100, Math.round(current * 100));
        }

        const keyLower = String(key || '').toLowerCase();

        if (
          keyLower.includes('fetch') ||
          keyLower.includes('download') ||
          keyLower.includes('wasm') ||
          keyLower.includes('model') ||
          keyLower.includes('init')
        ) {
          onProgress({
            stage: 'loading-model',
            percent,
            message:
              percent > 0
                ? `Downloading model assets (${percent}%)…`
                : 'Downloading model assets…',
          });
        } else {
          onProgress({
            stage: 'processing',
            percent,
            message:
              percent > 0
                ? `Removing background (${percent}%)…`
                : 'Separating subject from background…',
          });
        }
      },
    });

    const blob = await Promise.race([removalPromise, timeoutPromise]);
    clearTimeout(timer);

    if (onProgress) {
      onProgress({
        stage: 'complete',
        percent: 100,
        message: 'Background removed successfully!',
      });
    }

    return blob;
  } catch (err) {
    clearTimeout(timer);
    console.error('[BackgroundRemoval Engine Error]:', err);
    throw err;
  }
}

/**
 * Apply an optional solid background color (white, black) to a transparent PNG blob.
 *
 * @param {Blob} transparentBlob
 * @param {'transparent'|'white'|'black'} colorOption
 * @returns {Promise<Blob>}
 */
export async function applyBackgroundColor(transparentBlob, colorOption = 'transparent') {
  if (colorOption === 'transparent') {
    return transparentBlob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(transparentBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(transparentBlob);
          return;
        }

        // Fill background color
        if (colorOption === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (colorOption === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw transparent subject on top
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(transparentBlob);
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load transparent image for background compositing.'));
    };

    img.src = url;
  });
}

/**
 * Build a sensible filename for the background-removed image.
 *
 * @param {string} originalName
 * @param {'transparent'|'white'|'black'} [colorOption='transparent']
 * @returns {string}
 */
export function buildNoBgFilename(originalName, colorOption = 'transparent') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  if (colorOption === 'white') {
    return `${base}-white-bg.png`;
  }
  if (colorOption === 'black') {
    return `${base}-black-bg.png`;
  }
  return `${base}-no-background.png`;
}
