import { useEffect } from 'react';

import { site } from '@/config/site';

/**
 * Sets `document.title` for the lifetime of the calling component and restores
 * the previous value on unmount.
 *
 * @param {string} [title] Page title. Omit to fall back to the site name alone.
 * @param {{ withSuffix?: boolean }} [options] Append `| Site Name`. Default true.
 */
export function useDocumentTitle(title, { withSuffix = true } = {}) {
  useEffect(() => {
    const previous = document.title;

    document.title = title ? (withSuffix ? `${title} | ${site.name}` : title) : site.name;

    return () => {
      document.title = previous;
    };
  }, [title, withSuffix]);
}

export default useDocumentTitle;
