/**
 * textLayout.js
 * Comprehensive text measurement, auto-wrapping, and layout calculations
 * for Photoshop-style smart text boxes in the Smart Image Editor.
 */

let measurementCtx = null;

/**
 * Returns a cached 2D canvas rendering context for measuring text strings.
 */
const getMeasurementCtx = () => {
  if (typeof document === 'undefined') return null;
  if (!measurementCtx) {
    const canvas = document.createElement('canvas');
    measurementCtx = canvas.getContext('2d');
  }
  return measurementCtx;
};

/**
 * Measures text wrap lines matching DOM stage layout and canvas export 1:1.
 * Supports manual newlines (\n), natural word wrapping at box boundaries,
 * and character breaking for long unbroken strings.
 *
 * @param {string} text - The raw text content
 * @param {Object} options - Typography and layout settings
 * @returns {Object} { wrappedLines: string[], widestLine: number, maxLineWidth: number }
 */
export const computeTextWrapLines = (text, options = {}) => {
  const {
    fontSize = 32,
    fontFamily = 'Poppins',
    fontWeight = 'bold',
    fontStyle = 'normal',
    letterSpacing = 0,
    width = 180,
    padding = 8, // 4px left + 4px right padding matching DOM .stageTextContent
  } = options;

  const rawText = text ?? '';
  const maxLineWidth = Math.max(20, width - padding);

  const ctx = getMeasurementCtx();
  if (ctx) {
    ctx.font = `${fontStyle || 'normal'} ${fontWeight || 'normal'} ${fontSize}px "${fontFamily}", sans-serif`;
    if (letterSpacing && ctx.letterSpacing !== undefined) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }
  }

  const measure = (str) => {
    if (!str) return 0;
    if (!ctx) return str.length * (fontSize * 0.55);
    return ctx.measureText(str).width;
  };

  const paragraphs = rawText.split('\n');
  const wrappedLines = [];
  let widestLine = 0;

  paragraphs.forEach((para) => {
    if (!para) {
      wrappedLines.push('');
      return;
    }

    const words = para.split(' ');
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testW = measure(testLine);

      if (testW <= maxLineWidth) {
        currentLine = testLine;
      } else {
        if (currentLine !== '') {
          wrappedLines.push(currentLine);
          widestLine = Math.max(widestLine, measure(currentLine));
          currentLine = '';
        }

        // If a single unbroken word exceeds maxLineWidth, split by characters
        const wordW = measure(word);
        if (wordW > maxLineWidth) {
          let chunk = '';
          for (const char of word) {
            const testChunk = chunk + char;
            if (measure(testChunk) > maxLineWidth && chunk !== '') {
              wrappedLines.push(chunk);
              widestLine = Math.max(widestLine, measure(chunk));
              chunk = char;
            } else {
              chunk = testChunk;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    });

    if (currentLine !== '') {
      wrappedLines.push(currentLine);
      widestLine = Math.max(widestLine, measure(currentLine));
    }
  });

  return {
    wrappedLines: wrappedLines.length > 0 ? wrappedLines : [''],
    widestLine,
    maxLineWidth,
  };
};

/**
 * Calculates dynamic width and height for text layers.
 * - When autoWidth is true: expands width to fit content up to maxCanvasWidth, then wraps.
 * - When autoWidth is false: wraps text within fixed width and recalculates height.
 *
 * @param {string} text - Text content
 * @param {Object} options - Typography and layout options
 * @returns {Object} { width, height, wrappedLines, lineCount, lineHeightPx, widestLine }
 */
export const calculateTextDimensions = (text, options = {}) => {
  const {
    fontSize = 32,
    fontFamily = 'Poppins',
    fontWeight = 'bold',
    fontStyle = 'normal',
    letterSpacing = 0,
    lineHeight = 1.2,
    width = 180,
    autoWidth = false,
    maxCanvasWidth = 1000,
    padding = 8,
  } = options;

  let targetWidth = width || 180;

  if (autoWidth) {
    const ctx = getMeasurementCtx();
    if (ctx) {
      ctx.font = `${fontStyle || 'normal'} ${fontWeight || 'normal'} ${fontSize}px "${fontFamily}", sans-serif`;
      if (letterSpacing && ctx.letterSpacing !== undefined) {
        ctx.letterSpacing = `${letterSpacing}px`;
      }
    }
    const measure = (str) => {
      if (!str) return 0;
      if (!ctx) return str.length * (fontSize * 0.55);
      return ctx.measureText(str).width;
    };

    const paragraphs = (text || '').split('\n');
    let maxSingleLineWidth = 0;
    paragraphs.forEach((p) => {
      const w = measure(p);
      if (w > maxSingleLineWidth) maxSingleLineWidth = w;
    });

    // Content + padding + comfortable margin (16px)
    const needed = Math.ceil(maxSingleLineWidth + padding + 16);
    targetWidth = Math.min(maxCanvasWidth, Math.max(100, needed));
  }

  const { wrappedLines, widestLine } = computeTextWrapLines(text, {
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    letterSpacing,
    width: targetWidth,
    padding,
  });

  const lineCount = Math.max(1, wrappedLines.length);
  const lineH = Math.round(fontSize * (lineHeight || 1.2));
  const height = Math.max(36, lineCount * lineH + padding);

  return {
    width: targetWidth,
    height,
    wrappedLines,
    lineCount,
    lineHeightPx: lineH,
    widestLine,
  };
};

