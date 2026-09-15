/**
 * Generative Fill — client-side utilities only.
 * The actual AI generation is performed by the backend API.
 */

/**
 * Build sensible filename for downloaded generative fill result.
 */
export function buildGenerativeFillFilename(originalName, format = 'png') {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const ext = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg' ? 'jpg' : 'png';
  return `${base}-generative-fill.${ext}`;
}
