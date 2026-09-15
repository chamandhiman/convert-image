/**
 * Generative Fill API client.
 *
 * Calls the local backend proxy, which in turn calls the AI provider.
 * The API key stays server-side and is never exposed to the browser.
 */

const API_BASE = (import.meta.env.VITE_AI_API_BASE || 'http://localhost:3001').replace(/\/$/, '');

export async function generateInpaint({ imageBlob, maskBlob, prompt, onProgress }) {
  const form = new FormData();
  form.append('image', imageBlob, 'image.png');
  form.append('mask', maskBlob, 'mask.png');
  form.append('prompt', prompt);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/generative-fill`;
    xhr.open('POST', url);

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = `Generation failed (${xhr.status})`;
        try {
          const json = JSON.parse(xhr.responseText);
          message = json?.error || message;
        } catch {
          if (xhr.responseText) message = xhr.responseText.slice(0, 200);
        }
        return reject(new Error(message));
      }

      const blob = xhr.responseBlob;
      const resultUrl = URL.createObjectURL(blob);
      resolve({ blob, url: resultUrl });
    };

    xhr.onerror = () => {
      const msg = `Network error while generating. Please check your connection and try again. If the issue persists, verify the backend is running at ${API_BASE}.`;
      reject(new Error(msg));
    };
    xhr.ontimeout = () => reject(new Error('Generation timed out. Please try again.'));
    xhr.timeout = 180000; // 3 minutes

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 30);
          onProgress({ percent, message: 'Uploading your image…' });
        }
      };
    }

    xhr.send(form);
  });
}
