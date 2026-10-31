import type { AuditReportData, AuditCheckItem } from './rules';
import { calculateAuditScore } from './scoring';

/**
 * Browser-only audit of HTML that the visitor provides.
 * No network request occurs: HTTP status, response time, robots.txt, links'
 * live destinations and Core Web Vitals are not measured or inferred.
 */
export function auditLocalHtml(html: string, sourceName = 'uploaded-page.html'): AuditReportData {
  if (typeof DOMParser === 'undefined') {
    throw new Error('Your browser does not support HTML parsing.');
  }
  if (!html.trim() || html.length < 30) throw new Error('Provide a complete HTML document to analyze.');
  if (new Blob([html]).size > 2 * 1024 * 1024) throw new Error('HTML file is too large. Maximum supported size is 2 MB.');
  if (!/<(?:html|head|body|title|meta|h1|h2)\b/i.test(html)) {
    throw new Error('This does not look like a webpage HTML document.');
  }
  const document = new DOMParser().parseFromString(html, 'text/html');
  const content = document.documentElement;
  if (!content) throw new Error('Unable to parse HTML.');
  const title = (document.querySelector('title')?.textContent || '').trim();
  const description = (document.querySelector('meta[name="description" i]')?.getAttribute('content') || '').trim();
  const canonical = (document.querySelector('link[rel~="canonical" i]')?.getAttribute('href') || '').trim();
  const robots = (document.querySelector('meta[name="robots" i]')?.getAttribute('content') || '').trim();
  const viewport = (document.querySelector('meta[name="viewport" i]')?.getAttribute('content') || '').trim();
  const h1s = Array.from(document.querySelectorAll('h1')).map(x => (x.textContent || '').trim());
  const images = Array.from(document.querySelectorAll('img'));
  const missingAlt = images.filter(img => !img.hasAttribute('alt'));
  const links = Array.from(document.querySelectorAll('a[href]'));
  const headers = {} as Record<string, string>;
  const og: Record<string, string> = {}, twitter: Record<string, string> = {};
  document.querySelectorAll('meta[property^="og:" i]').forEach(node => {
    const key = node.getAttribute('property');
    if (key) og[key] = node.getAttribute('content') || '';
  });
  document.querySelectorAll('meta[name^="twitter:" i]').forEach(node => {
    const key = node.getAttribute('name');
    if (key) twitter[key] = node.getAttribute('content') || '';
  });
  const schemas: { type: string; rawSnippet?: string }[] = [];
  let invalidJsonLd = 0;
  document.querySelectorAll('script[type="application/ld+json" i]').forEach(node => {
    try {
      const parsed = JSON.parse(node.textContent || '');
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        if (entry && typeof entry === 'object') {
          schemas.push({ type: String(entry['@type'] || 'Unknown') });
        }
      }
    } catch {
      invalidJsonLd += 1;
    }
  });
  const checks: AuditCheckItem[] = [];
  const add = (id: string, category: AuditCheckItem['category'], name: string, status: AuditCheckItem['status'], weight: number, message: string, recommendation?: string) => {
    checks.push({ id, category, title: name, status, maxPoints: weight,
      pointsEarned: status === 'passed' ? weight : status === 'warning' ? Math.round(weight * 0.5) : 0,
      message, recommendation });
  };
  add('title', 'core', 'Page title', !title ? 'error' : title.length > 65 ? 'warning' : 'passed', 12,
    title ? 'Found: ' + title.slice(0, 180) : 'Missing title element',
    'Write a unique, descriptive title. Search engines may truncate or replace it.');
  add('description', 'core', 'Meta description',
    !description ? 'error' : description.length < 70 || description.length > 170 ? 'warning' : 'passed',
    10, description ? 'Found description (' + description.length + ' characters)' : 'No meta description present',
    'Summarize the page accurately. Google may show a different snippet.');
  add('h1', 'core', 'Primary heading (H1)',
    h1s.length === 1 && !!h1s[0] ? 'passed' : h1s.length ? 'warning' : 'error',
    10, h1s.length + ' H1 heading(s) found',
    'Use a clear and meaningful heading that reflects page content.');
  add('lang', 'content', 'HTML language',
    document.documentElement.getAttribute('lang')?.trim() ? 'passed' : 'warning',
    6, 'lang=' + (document.documentElement.getAttribute('lang') || 'not specified'),
    'Set a valid language on the html element, e.g. lang="en".');
  add('viewport', 'core', 'Responsive viewport', viewport.includes('width=device-width') ? 'passed' : 'warning',
    9, viewport ? 'Viewport: ' + viewport : 'No responsive viewport directive found',
    'Add meta name="viewport" content="width=device-width, initial-scale=1".');
  add('canonical', 'indexability', 'Canonical URL',
    !canonical ? 'warning' : /^https?:\/\/\S+$/i.test(canonical) ? 'passed' : 'error',
    10, canonical ? 'Canonical: ' + canonical.slice(0, 180) : 'No canonical tag found',
    'If needed, set a complete canonical URL for the preferred page.');
  add('robots', 'indexability', 'Indexing directive',
    /\bnoindex\b/i.test(robots) ? 'warning' : 'passed', 8,
    robots ? 'HTML robots directive: ' + robots : 'No restrictive robots meta tag found',
    'Verify noindex is intentional; robots.txt and response headers cannot be checked offline.');
  add('alt', 'content', 'Image alt attributes',
    missingAlt.length === 0 ? 'passed' : 'warning', 10,
    images.length + ' images; ' + missingAlt.length + ' without alt attribute',
    'Add meaningful alt text for informative images; use alt="" for purely decorative images.');
  add('links', 'content', 'Link text',
    links.some(a => !(a.textContent || '').trim() && !a.getAttribute('aria-label')) ? 'warning' : 'passed', 6,
    links.length + ' anchor links found (destinations not fetched)',
    'Give each interactive link an accessible descriptive name.');
  add('og', 'social', 'Open Graph title and description',
    og['og:title'] && og['og:description'] ? 'passed' : 'warning', 7,
    (og['og:title'] && og['og:description']) ? 'Open Graph metadata found' : 'Some Open Graph metadata is missing',
    'Add og:title and og:description for social sharing.');
  add('schema', 'social', 'JSON-LD structured data',
    invalidJsonLd ? 'error' : schemas.length ? 'passed' : 'warning', 8,
    schemas.length + ' JSON-LD schema object(s); ' + invalidJsonLd + ' invalid script(s)',
    'Validate markup in the official Google Rich Results Test. Structured data is optional for many pages.');
  add('favicon', 'content', 'Favicon reference',
    document.querySelector('link[rel~="icon" i]') ? 'passed' : 'warning', 4,
    document.querySelector('link[rel~="icon" i]') ? 'A favicon is referenced' : 'No favicon link found',
    'Add a favicon to help identify the website in browser tabs.');
  const result = calculateAuditScore(checks);
  const label = sourceName.replace(/[^\w .-]/g, '').slice(0, 90) || 'local-html';
  return {
    targetUrl: 'Local HTML: ' + label, finalUrl: '', statusCode: 0,
    fetchDurationMs: 0, timestamp: new Date().toISOString(),
    pageSizeBytes: new Blob([html]).size,
    score: result.totalScore, grade: result.grade, categories: result.categories,
    checks, summary: result.summary,
    unsupportedChecks: [
      { name: 'HTTP status and server response time', reason: 'Local HTML is not a live HTTP response.' },
      { name: 'robots.txt, response headers and redirects', reason: 'Cannot be inspected without fetching the live URL from a server.' },
      { name: 'Core Web Vitals, mobile usability and page speed', reason: 'Real-page lab or field measurements require separate services.' },
      { name: 'Live external and internal links', reason: 'Link destinations were not fetched or verified.' },
      { name: 'Ranking predictions', reason: 'A static HTML snapshot cannot determine Google ranking.' }
    ],
    metadata: {
      title, description, canonical, robots, viewport, h1s,
      h2Count: document.querySelectorAll('h2').length, h3Count: document.querySelectorAll('h3').length,
      imagesCount: images.length, imagesMissingAlt: missingAlt.length,
      missingAltSamples: missingAlt.slice(0, 5).map(img => ({
        src: img.getAttribute('src') || '',
        tagSnippet: img.outerHTML.slice(0, 200)
      })),
      internalLinksCount: links.filter(a => (a.getAttribute('href') || '').startsWith('/')).length,
      externalLinksCount: links.filter(a => /^https?:\/\//i.test(a.getAttribute('href') || '')).length,
      openGraph: og, twitterCard: twitter, schemasFound: schemas, headers
    }
  };
}
