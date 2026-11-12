import { useEffect } from 'react';
import { site } from '@/config/site';

/**
 * SeoHead component
 * Injects meta tags, title, canonical URLs, Open Graph data, and JSON-LD schema
 * directly into document.head for search engines and social crawlers.
 */
export function SeoHead({
  title,
  description,
  canonicalPath = '',
  keywords,
  toolName,
  faqs = [],
  schemaType = 'WebApplication',
}) {
  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title
      ? `${title} | ${site.name} by ${site.brand}`
      : `${site.name} — ${site.tagline}`;
    document.title = fullTitle;

    // Helper to set or update meta tag
    function setMeta(selector, attr, attrVal, content) {
      if (!content) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }

    // Standard SEO tags
    const desc = description || site.description;
    setMeta('meta[name="description"]', 'name', 'description', desc);
    if (keywords) {
      setMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    }

    // Canonical link
    const canonicalUrl = `${site.url}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    // Twitter
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);

    // JSON-LD Structured Data
    const scriptsToClean = [];

    // 1. WebApplication Schema
    if (toolName) {
      const appSchema = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: `${toolName} — ${site.name}`,
        url: canonicalUrl,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All Modern Browsers (Chrome, Edge, Firefox, Safari)',
        browserRequirements: 'Requires HTML5, WebAssembly, and Canvas support',
        description: desc,
        publisher: {
          '@type': 'Organization',
          name: site.brand,
          url: 'https://webtoolocean.com',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      };

      const scriptApp = document.createElement('script');
      scriptApp.type = 'application/ld+json';
      scriptApp.id = `schema-app-${canonicalPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      scriptApp.textContent = JSON.stringify(appSchema);
      document.head.appendChild(scriptApp);
      scriptsToClean.push(scriptApp);
    }

    // 2. FAQPage Schema
    if (faqs && faqs.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      };

      const scriptFaq = document.createElement('script');
      scriptFaq.type = 'application/ld+json';
      scriptFaq.id = `schema-faq-${canonicalPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      scriptFaq.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(scriptFaq);
      scriptsToClean.push(scriptFaq);
    }

    return () => {
      document.title = prevTitle;
      scriptsToClean.forEach((script) => {
        if (script.parentNode) script.parentNode.removeChild(script);
      });
    };
  }, [title, description, canonicalPath, keywords, toolName, faqs, schemaType]);

  return null;
}

export default SeoHead;

