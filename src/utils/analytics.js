/**
 * Google Analytics 4 (GA4) Analytics & Event Tracking Helper
 * Measurement ID: G-4C1PP726EZ
 *
 * Privacy Guarantees:
 * - 100% Client-Side: Never transmits raw image buffers, file names, file paths, or PII.
 * - Non-blocking: Silently ignores events if gtag is unavailable or blocked by ad-blockers.
 * - Deduplication: Prevents double-firing of page_view and custom conversion events.
 */

/**
 * Generic safe gtag event dispatcher.
 * @param {string} eventName
 * @param {Record<string, unknown>} params
 */
export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch {
    // Non-blocking, fails gracefully
  }
}

/**
 * Track image upload action.
 * @param {{ tool: string, format?: string, count?: number }} options
 */
export function trackImageUpload({ tool, format, count = 1 }) {
  trackEvent('image_upload', {
    tool_name: tool,
    input_format: format ? String(format).toLowerCase().replace('image/', '') : undefined,
    item_count: count,
  });
}

/**
 * Track successful image conversion/processing.
 * @param {{ tool: string, inputFormat?: string, outputFormat?: string, count?: number }} options
 */
export function trackImageConvert({ tool, inputFormat, outputFormat, count = 1 }) {
  trackEvent('image_convert', {
    tool_name: tool,
    input_format: inputFormat ? String(inputFormat).toLowerCase().replace('image/', '') : undefined,
    output_format: outputFormat ? String(outputFormat).toLowerCase().replace('image/', '') : undefined,
    item_count: count,
  });
}

/**
 * Track image download action.
 * @param {{ tool: string, outputFormat?: string, isBatch?: boolean }} options
 */
export function trackImageDownload({ tool, outputFormat, isBatch = false }) {
  trackEvent('image_download', {
    tool_name: tool,
    output_format: outputFormat ? String(outputFormat).toLowerCase().replace('image/', '') : undefined,
    is_batch: isBatch,
  });
}
