import { parse, HTMLElement } from 'node-html-parser';
import { validateTargetUrl } from './security/urlGuard';
import { validateHostIp } from './security/ipGuard';
import { AuditCheckItem, AuditReportData } from '../lib/audit/rules';
import { calculateAuditScore } from '../lib/audit/scoring';

interface FetchResult {
  statusCode: number;
  finalUrl: string;
  durationMs: number;
  bodyText: string;
  headers: Record<string, string>;
  sizeBytes: number;
}

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10000;
const MAX_BODY_BYTES = 3 * 1024 * 1024; // 3MB

/**
 * Safely fetches an external URL with SSRF guards on every hop.
 */
async function safeFetchUrl(initialUrl: string): Promise<FetchResult> {
  let currentUrl = initialUrl;
  let redirectsCount = 0;
  const startTime = Date.now();

  while (redirectsCount <= MAX_REDIRECTS) {
    // 1. URL parsing & scheme validation
    const urlValidation = validateTargetUrl(currentUrl);
    if (!urlValidation.valid || !urlValidation.url) {
      throw new Error(urlValidation.error || 'Invalid URL target.');
    }

    const parsed = urlValidation.url;

    // 2. IP & DNS resolution guard
    const ipValidation = await validateHostIp(parsed.hostname);
    if (!ipValidation.valid) {
      throw new Error(ipValidation.error || 'Target destination failed IP security checks.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(parsed.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RankNova-SEO-Bot/1.0; +https://ranknova.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        redirect: 'manual', // Manually validate each redirect
        signal: controller.signal
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Target request timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.`);
      }
      throw new Error(`Failed to fetch URL: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timeout);
    }

    // Check for redirects
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      redirectsCount++;
      if (redirectsCount > MAX_REDIRECTS) {
        throw new Error(`Too many redirects (exceeded limit of ${MAX_REDIRECTS}).`);
      }
      const location = res.headers.get('location');
      if (!location) {
        throw new Error('Redirect returned without Location header.');
      }
      currentUrl = new URL(location, parsed.toString()).toString();
      continue;
    }

    // Content type check
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Target returned non-HTML content type (${contentType}). Audit only supports HTML pages.`);
    }

    // Stream and cap response body
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_BODY_BYTES) {
            reader.cancel();
            throw new Error(`Target page exceeded maximum allowed size of 3MB.`);
          }
          chunks.push(value);
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const bodyBuffer = Buffer.concat(chunks);
    const bodyText = bodyBuffer.toString('utf-8');

    const headersRecord: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    return {
      statusCode: res.status,
      finalUrl: currentUrl,
      durationMs,
      bodyText,
      headers: headersRecord,
      sizeBytes: receivedBytes
    };
  }

  throw new Error('Too many redirects occurred.');
}

/**
 * Executes transparent rule-based SEO audit checks on the parsed DOM.
 */
export async function runSeoAudit(targetUrl: string): Promise<AuditReportData> {
  const fetchResult = await safeFetchUrl(targetUrl);
  const root = parse(fetchResult.bodyText);

  const checks: AuditCheckItem[] = [];

  // 1. HTTP Status Code Check
  if (fetchResult.statusCode === 200) {
    checks.push({
      id: 'http-status',
      category: 'core',
      title: 'HTTP Status Code',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `The server returned an optimal 200 OK status code.`,
      details: { statusCode: fetchResult.statusCode }
    });
  } else {
    checks.push({
      id: 'http-status',
      category: 'core',
      title: 'HTTP Status Code',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 10,
      message: `The server returned status ${fetchResult.statusCode}. Search engines require a 200 OK code to index normal pages.`,
      recommendation: 'Ensure your server configuration returns HTTP 200 for canonical landing pages.',
      details: { statusCode: fetchResult.statusCode }
    });
  }

  // 2. Page Title Check
  const titleEl = root.querySelector('title');
  const titleText = titleEl ? titleEl.text.trim() : '';
  const titleLength = titleText.length;

  if (!titleText) {
    checks.push({
      id: 'title-presence',
      category: 'core',
      title: 'Page Title Tag',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 10,
      message: 'Missing <title> tag. The page title is one of the most critical on-page ranking signals.',
      recommendation: 'Add a descriptive <title> tag between 50 and 60 characters.',
      codeSnippet: '<title>Your Primary Keyword - Brand Name</title>'
    });
  } else if (titleLength >= 40 && titleLength <= 65) {
    checks.push({
      id: 'title-presence',
      category: 'core',
      title: 'Page Title Tag',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `Title tag is present with an optimal length of ${titleLength} characters: "${titleText}".`,
      details: { title: titleText, length: titleLength }
    });
  } else if (titleLength < 40) {
    checks.push({
      id: 'title-presence',
      category: 'core',
      title: 'Page Title Tag',
      status: 'warning',
      pointsEarned: 6,
      maxPoints: 10,
      message: `Title tag is short (${titleLength} characters). You may be missing opportunities to include primary target keywords and branding.`,
      recommendation: 'Expand your title to between 50 and 60 characters to optimize SERP visibility.',
      details: { title: titleText, length: titleLength }
    });
  } else {
    checks.push({
      id: 'title-presence',
      category: 'core',
      title: 'Page Title Tag',
      status: 'warning',
      pointsEarned: 7,
      maxPoints: 10,
      message: `Title tag is lengthy (${titleLength} characters) and may be truncated on Google desktop and mobile SERPs (approx 600px).`,
      recommendation: 'Trim title to 50–60 characters to avoid truncation in search snippets.',
      details: { title: titleText, length: titleLength }
    });
  }

  // 3. Meta Description Check
  const metaDescEl = root.querySelector('meta[name="description" i]');
  const metaDescText = metaDescEl ? (metaDescEl.getAttribute('content') || '').trim() : '';
  const metaDescLength = metaDescText.length;

  if (!metaDescText) {
    checks.push({
      id: 'meta-description',
      category: 'core',
      title: 'Meta Description',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 10,
      message: 'No meta description found. Google may generate random text snippets from page content.',
      recommendation: 'Add an engaging meta description between 120 and 160 characters summarizing the page value.',
      codeSnippet: '<meta name="description" content="Engaging summary of your page with clear call to action..." />'
    });
  } else if (metaDescLength >= 110 && metaDescLength <= 165) {
    checks.push({
      id: 'meta-description',
      category: 'core',
      title: 'Meta Description',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `Meta description is present and well-proportioned (${metaDescLength} characters).`,
      details: { description: metaDescText, length: metaDescLength }
    });
  } else if (metaDescLength < 110) {
    checks.push({
      id: 'meta-description',
      category: 'core',
      title: 'Meta Description',
      status: 'warning',
      pointsEarned: 6,
      maxPoints: 10,
      message: `Meta description is brief (${metaDescLength} characters). A more descriptive summary improves click-through rate.`,
      recommendation: 'Aim for 120–160 characters to fully convey the page benefit in search snippets.',
      details: { description: metaDescText, length: metaDescLength }
    });
  } else {
    checks.push({
      id: 'meta-description',
      category: 'core',
      title: 'Meta Description',
      status: 'warning',
      pointsEarned: 7,
      maxPoints: 10,
      message: `Meta description is long (${metaDescLength} characters) and will likely be truncated on mobile devices (~120 chars) and desktop (~160 chars).`,
      recommendation: 'Shorten meta description to 140–160 characters.',
      details: { description: metaDescText, length: metaDescLength }
    });
  }

  // 4. Canonical Tag Check
  const canonicalEl = root.querySelector('link[rel="canonical" i]');
  const canonicalHref = canonicalEl ? (canonicalEl.getAttribute('href') || '').trim() : '';

  if (!canonicalHref) {
    checks.push({
      id: 'canonical-tag',
      category: 'indexability',
      title: 'Canonical URL Directive',
      status: 'warning',
      pointsEarned: 5,
      maxPoints: 10,
      message: 'No canonical link tag specified. Without a canonical tag, URL query parameters or duplicates can dilute ranking signals.',
      recommendation: 'Specify a self-referencing canonical URL in the <head>.',
      codeSnippet: `<link rel="canonical" href="${fetchResult.finalUrl}" />`
    });
  } else {
    const isAbsolute = /^https?:\/\//i.test(canonicalHref);
    if (!isAbsolute) {
      checks.push({
        id: 'canonical-tag',
        category: 'indexability',
        title: 'Canonical URL Directive',
        status: 'warning',
        pointsEarned: 6,
        maxPoints: 10,
        message: `Canonical link uses a relative path (${canonicalHref}). Google strongly advises absolute URLs.`,
        recommendation: 'Change canonical href to a fully-qualified absolute URL starting with https://.',
        codeSnippet: `<link rel="canonical" href="${new URL(canonicalHref, fetchResult.finalUrl).toString()}" />`
      });
    } else {
      checks.push({
        id: 'canonical-tag',
        category: 'indexability',
        title: 'Canonical URL Directive',
        status: 'passed',
        pointsEarned: 10,
        maxPoints: 10,
        message: `Canonical URL is configured with an absolute URL: ${canonicalHref}.`,
        details: { canonical: canonicalHref }
      });
    }
  }

  // 5. Robots Meta Directives
  const robotsMetaEl = root.querySelector('meta[name="robots" i]');
  const robotsContent = robotsMetaEl ? (robotsMetaEl.getAttribute('content') || '').toLowerCase().trim() : '';
  const xRobotsTag = fetchResult.headers['x-robots-tag'] || '';

  const hasNoIndex = robotsContent.includes('noindex') || xRobotsTag.toLowerCase().includes('noindex');
  const hasNoFollow = robotsContent.includes('nofollow') || xRobotsTag.toLowerCase().includes('nofollow');

  if (hasNoIndex) {
    checks.push({
      id: 'robots-directives',
      category: 'indexability',
      title: 'Robots Indexability',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 10,
      message: 'Page specifies "noindex" directive in meta tag or HTTP header. Google will NOT index this page.',
      recommendation: 'Remove the noindex directive if you want this page to appear in organic search results.',
      details: { robotsMeta: robotsContent, xRobotsTag }
    });
  } else {
    checks.push({
      id: 'robots-directives',
      category: 'indexability',
      title: 'Robots Indexability',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: 'Page is indexable by web crawlers (no noindex tags blocking search bots).',
      details: { robotsMeta: robotsContent || 'index, follow (default)', xRobotsTag }
    });
  }

  // 6. Viewport Tag (Mobile Experience)
  const viewportEl = root.querySelector('meta[name="viewport" i]');
  const viewportContent = viewportEl ? (viewportEl.getAttribute('content') || '').toLowerCase().trim() : '';

  if (!viewportContent || !viewportContent.includes('width=device-width')) {
    checks.push({
      id: 'viewport-meta',
      category: 'indexability',
      title: 'Mobile Viewport Tag',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 5,
      message: 'Missing or incomplete mobile viewport tag. Mobile-first indexing requires proper viewport configuration.',
      recommendation: 'Include a responsive viewport meta tag in your <head>.',
      codeSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
    });
  } else {
    checks.push({
      id: 'viewport-meta',
      category: 'indexability',
      title: 'Mobile Viewport Tag',
      status: 'passed',
      pointsEarned: 5,
      maxPoints: 5,
      message: 'Mobile viewport tag is properly configured for responsive mobile-friendly display.',
      details: { viewport: viewportContent }
    });
  }

  // 7. Headings Structure (H1, H2, H3)
  const h1Els = root.querySelectorAll('h1');
  const h1Texts = h1Els.map(el => el.text.trim()).filter(Boolean);
  const h2Count = root.querySelectorAll('h2').length;
  const h3Count = root.querySelectorAll('h3').length;

  if (h1Texts.length === 1) {
    checks.push({
      id: 'heading-h1',
      category: 'content',
      title: 'H1 Heading Structure',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `Page has exactly one clear H1 heading: "${h1Texts[0]}".`,
      details: { h1: h1Texts[0], h2Count, h3Count }
    });
  } else if (h1Texts.length === 0) {
    checks.push({
      id: 'heading-h1',
      category: 'content',
      title: 'H1 Heading Structure',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 10,
      message: 'No H1 heading found on the page. An H1 indicates the primary subject of your document to search engines.',
      recommendation: 'Add a single top-level <h1> heading summarizing your page topic.',
      codeSnippet: '<h1>Primary Keyword Title</h1>',
      details: { h2Count, h3Count }
    });
  } else {
    checks.push({
      id: 'heading-h1',
      category: 'content',
      title: 'H1 Heading Structure',
      status: 'warning',
      pointsEarned: 5,
      maxPoints: 10,
      message: `Multiple H1 headings detected (${h1Texts.length} H1 tags found). While modern HTML allows this, a single primary H1 provides clearer hierarchy.`,
      recommendation: 'Consolidate secondary H1s into H2 subheadings.',
      details: { h1s: h1Texts, h2Count, h3Count }
    });
  }

  // 8. Image Alt Attributes
  const imgEls = root.querySelectorAll('img');
  const totalImages = imgEls.length;
  const missingAltImgs: { src: string; tagSnippet: string }[] = [];

  for (const img of imgEls) {
    const alt = img.getAttribute('alt');
    const src = img.getAttribute('src') || '';
    if (alt === undefined || alt === null || alt.trim() === '') {
      missingAltImgs.push({
        src,
        tagSnippet: img.rawAttrs ? `<img ${img.rawAttrs.slice(0, 100)}... />` : '<img>'
      });
    }
  }

  if (totalImages === 0) {
    checks.push({
      id: 'image-alt',
      category: 'content',
      title: 'Image Alt Attributes',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: 'No image elements detected on this page.',
      details: { totalImages: 0, missingAltCount: 0 }
    });
  } else if (missingAltImgs.length === 0) {
    checks.push({
      id: 'image-alt',
      category: 'content',
      title: 'Image Alt Attributes',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `All ${totalImages} image(s) have descriptive alt attributes for accessibility and Google Image Search.`,
      details: { totalImages, missingAltCount: 0 }
    });
  } else {
    const missingRatio = missingAltImgs.length / totalImages;
    checks.push({
      id: 'image-alt',
      category: 'content',
      title: 'Image Alt Attributes',
      status: missingRatio > 0.4 ? 'error' : 'warning',
      pointsEarned: Math.max(0, Math.round(10 * (1 - missingRatio))),
      maxPoints: 10,
      message: `${missingAltImgs.length} of ${totalImages} image(s) are missing alt attributes. Alt text is vital for accessibility (WCAG 2.2) and image ranking.`,
      recommendation: 'Add concise, descriptive alt text to every informative image.',
      codeSnippet: '<img src="example.webp" alt="Descriptive keyword-rich description" />',
      details: {
        totalImages,
        missingAltCount: missingAltImgs.length,
        samples: missingAltImgs.slice(0, 5)
      }
    });
  }

  // 9. Links Analysis
  const linkEls = root.querySelectorAll('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;
  const pageOrigin = new URL(fetchResult.finalUrl).origin;

  for (const a of linkEls) {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      continue;
    }
    if (href.startsWith('/') || href.startsWith(pageOrigin)) {
      internalLinks++;
    } else if (/^https?:\/\//i.test(href)) {
      externalLinks++;
    }
  }

  checks.push({
    id: 'link-structure',
    category: 'content',
    title: 'Link Architecture',
    status: internalLinks > 0 ? 'passed' : 'warning',
    pointsEarned: internalLinks > 0 ? 5 : 2,
    maxPoints: 5,
    message: `Detected ${internalLinks} internal link(s) and ${externalLinks} external link(s).`,
    recommendation: internalLinks === 0 ? 'Add internal links to connect relevant related content across your site.' : undefined,
    details: { internalLinks, externalLinks, total: linkEls.length }
  });

  // 10. Open Graph Metadata
  const ogTitle = root.querySelector('meta[property="og:title" i]')?.getAttribute('content') || '';
  const ogDesc = root.querySelector('meta[property="og:description" i]')?.getAttribute('content') || '';
  const ogImage = root.querySelector('meta[property="og:image" i]')?.getAttribute('content') || '';
  const ogUrl = root.querySelector('meta[property="og:url" i]')?.getAttribute('content') || '';
  const ogType = root.querySelector('meta[property="og:type" i]')?.getAttribute('content') || '';

  const ogTags: Record<string, string> = {
    title: ogTitle,
    description: ogDesc,
    image: ogImage,
    url: ogUrl,
    type: ogType
  };

  const hasOg = Boolean(ogTitle || ogImage || ogDesc);
  if (ogTitle && ogImage) {
    checks.push({
      id: 'open-graph',
      category: 'social',
      title: 'Open Graph Social Cards',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: 'Open Graph tags (og:title, og:image, og:description) are properly configured for Facebook, LinkedIn, and messaging previews.',
      details: ogTags
    });
  } else if (hasOg) {
    checks.push({
      id: 'open-graph',
      category: 'social',
      title: 'Open Graph Social Cards',
      status: 'warning',
      pointsEarned: 5,
      maxPoints: 10,
      message: 'Incomplete Open Graph implementation. Missing ' + (!ogImage ? 'og:image' : 'og:title') + '.',
      recommendation: 'Provide complete og:title, og:image (1200x630px recommended), and og:description.',
      codeSnippet: '<meta property="og:title" content="Page Title" />\n<meta property="og:image" content="https://example.com/share.jpg" />'
    });
  } else {
    checks.push({
      id: 'open-graph',
      category: 'social',
      title: 'Open Graph Social Cards',
      status: 'error',
      pointsEarned: 0,
      maxPoints: 10,
      message: 'No Open Graph metadata found. Shared links will lack visual preview cards on social networks.',
      recommendation: 'Use RankNova’s Meta Tag Generator to generate full Open Graph tags.',
      codeSnippet: '<meta property="og:title" content="Page Title" />\n<meta property="og:image" content="https://example.com/share.jpg" />'
    });
  }

  // 11. Structured Data (JSON-LD)
  const scriptLdEls = root.querySelectorAll('script[type="application/ld+json" i]');
  const schemasFound: { type: string; rawSnippet?: string }[] = [];

  for (const script of scriptLdEls) {
    try {
      const json = JSON.parse(script.text);
      if (Array.isArray(json)) {
        for (const item of json) {
          if (item && item['@type']) schemasFound.push({ type: String(item['@type']) });
        }
      } else if (json && json['@type']) {
        schemasFound.push({ type: String(json['@type']), rawSnippet: script.text.slice(0, 150) });
      }
    } catch {
      // Malformed json-ld script
      schemasFound.push({ type: 'Malformed JSON-LD' });
    }
  }

  if (schemasFound.length > 0 && !schemasFound.some(s => s.type === 'Malformed JSON-LD')) {
    checks.push({
      id: 'structured-data',
      category: 'social',
      title: 'Structured Data (Schema.org)',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `Detected ${schemasFound.length} valid JSON-LD schema block(s): ${schemasFound.map(s => s.type).join(', ')}.`,
      details: { schemas: schemasFound }
    });
  } else if (schemasFound.some(s => s.type === 'Malformed JSON-LD')) {
    checks.push({
      id: 'structured-data',
      category: 'social',
      title: 'Structured Data (Schema.org)',
      status: 'error',
      pointsEarned: 2,
      maxPoints: 10,
      message: 'Detected JSON-LD script block but the JSON is malformed and cannot be parsed.',
      recommendation: 'Validate your schema using RankNova’s Schema JSON-LD Generator and test in Google Rich Results Test.'
    });
  } else {
    checks.push({
      id: 'structured-data',
      category: 'social',
      title: 'Structured Data (Schema.org)',
      status: 'warning',
      pointsEarned: 4,
      maxPoints: 10,
      message: 'No Schema.org JSON-LD structured data detected. Adding structured data enables Google rich search snippets.',
      recommendation: 'Add relevant schema (e.g., Article, Product, LocalBusiness, BreadcrumbList) using RankNova’s Schema Generator.'
    });
  }

  // 12. Response Duration & Performance
  if (fetchResult.durationMs <= 600) {
    checks.push({
      id: 'response-time',
      category: 'performance',
      title: 'Server Response Time (TTFB)',
      status: 'passed',
      pointsEarned: 10,
      maxPoints: 10,
      message: `Fast server response time: ${fetchResult.durationMs}ms (well under the 800ms Google recommendation).`,
      details: { durationMs: fetchResult.durationMs, pageSizeBytes: fetchResult.sizeBytes }
    });
  } else if (fetchResult.durationMs <= 1500) {
    checks.push({
      id: 'response-time',
      category: 'performance',
      title: 'Server Response Time (TTFB)',
      status: 'warning',
      pointsEarned: 6,
      maxPoints: 10,
      message: `Moderate response time: ${fetchResult.durationMs}ms. Consider server-side caching or CDN edge caching.`,
      details: { durationMs: fetchResult.durationMs, pageSizeBytes: fetchResult.sizeBytes }
    });
  } else {
    checks.push({
      id: 'response-time',
      category: 'performance',
      title: 'Server Response Time (TTFB)',
      status: 'error',
      pointsEarned: 2,
      maxPoints: 10,
      message: `Slow response time: ${fetchResult.durationMs}ms. Slow server response adversely affects Core Web Vitals (LCP) and crawl budget.`,
      recommendation: 'Enable CDN caching, optimize database queries, or upgrade hosting performance.',
      details: { durationMs: fetchResult.durationMs, pageSizeBytes: fetchResult.sizeBytes }
    });
  }

  // Calculate overall custom score
  const { totalScore, grade, categories, summary } = calculateAuditScore(checks);

  // Clearly document checks that were deliberately omitted
  const unsupportedChecks = [
    {
      name: 'Client-Side JavaScript Rendering',
      reason: 'JavaScript execution is omitted for sandbox security and fast rule-based verification. Raw initial HTML was parsed.'
    },
    {
      name: 'Simulated Real-User CWV Field Data',
      reason: 'Field metrics require Google Chrome UX Report (CrUX) origin aggregation over 28 days.'
    },
    {
      name: 'Robots.txt Domain-Level Parser',
      reason: 'Audit was restricted to the single target page request to prevent unnecessary external network requests.'
    }
  ];

  return {
    targetUrl,
    finalUrl: fetchResult.finalUrl,
    statusCode: fetchResult.statusCode,
    fetchDurationMs: fetchResult.durationMs,
    timestamp: new Date().toISOString(),
    pageSizeBytes: fetchResult.sizeBytes,
    score: totalScore,
    grade,
    categories,
    checks,
    unsupportedChecks,
    summary,
    metadata: {
      title: titleText,
      description: metaDescText,
      canonical: canonicalHref,
      robots: robotsContent || (hasNoIndex ? 'noindex' : 'index, follow'),
      viewport: viewportContent,
      h1s: h1Texts,
      h2Count,
      h3Count,
      imagesCount: totalImages,
      imagesMissingAlt: missingAltImgs.length,
      missingAltSamples: missingAltImgs.slice(0, 5),
      internalLinksCount: internalLinks,
      externalLinksCount: externalLinks,
      openGraph: ogTags,
      twitterCard: {
        card: root.querySelector('meta[name="twitter:card" i]')?.getAttribute('content') || '',
        title: root.querySelector('meta[name="twitter:title" i]')?.getAttribute('content') || '',
        description: root.querySelector('meta[name="twitter:description" i]')?.getAttribute('content') || ''
      },
      schemasFound,
      headers: fetchResult.headers
    }
  };
}
