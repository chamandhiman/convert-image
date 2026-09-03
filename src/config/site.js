/**
 * Static product metadata. Anything shown in <title>, meta tags, the footer or
 * structured data should read from here rather than being typed inline.
 */

import { env } from './env';

export const site = {
  name: 'Convert Image',
  shortName: 'ConvertImage',
  tagline: 'Fast, private image conversion in your browser',
  description:
    'Convert images between formats without uploading them anywhere. Everything runs locally in your browser.',
  url: env.siteUrl,
  locale: 'en',
  themeColor: '#1f3fed',
};

export default site;
