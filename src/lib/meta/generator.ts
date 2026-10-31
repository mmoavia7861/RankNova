export interface MetaVariant {
  title: string;
  description: string;
  titleChars: number;
  titlePixels: number;
  descChars: number;
  style: 'Direct & Definitive' | 'Action & Benefit' | 'Comprehensive Guide' | 'Brand-First' | 'Question & Solution';
}

export interface GeneratedMetaResult {
  variants: MetaVariant[];
  htmlSnippet: string;
  ogSnippet: string;
  canonicalSnippet?: string;
}

/**
 * Approximates Google Desktop SERP pixel width for Arial/system-ui ~18-20px font.
 */
export function estimateTitlePixelWidth(title: string): number {
  let width = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title[i];
    if (['i', 'l', 'j', 't', 'r', ' ', '.', ',', '!', ':', ';', "'"].includes(char)) {
      width += 4.5;
    } else if (['m', 'w', 'M', 'W', '@', '%'].includes(char)) {
      width += 14.5;
    } else if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      width += 11.5;
    } else {
      width += 9.5;
    }
  }
  return Math.round(width);
}

export function generateMetaSuggestions(params: {
  keyword: string;
  topic: string;
  brand?: string;
  url?: string;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
}): GeneratedMetaResult {
  const kw = params.keyword.trim();
  const topic = params.topic.trim();
  const brand = params.brand ? params.brand.trim() : '';
  const url = params.url ? params.url.trim() : '';

  const capKw = kw.charAt(0).toUpperCase() + kw.slice(1);
  const brandSuffix = brand ? ` | ${brand}` : '';

  // Build practical templates from actual user-provided keyword, purpose and
  // search intent, without inventing reviews, rankings or product guarantees.
  const detail = (topic || kw).replace(/\s+/g, ' ').slice(0, 110);
  const intent = params.intent || 'informational';
  const verb = intent === 'transactional' ? 'Get Started with'
    : intent === 'commercial' ? 'Compare and Explore'
    : intent === 'navigational' ? 'Find'
    : 'Understand';
  const titleOptions: { title: string; style: MetaVariant['style'] }[] = [
    { title: capKw + ': Key Information' + brandSuffix, style: 'Direct & Definitive' },
    { title: verb + ' ' + capKw + brandSuffix, style: 'Action & Benefit' },
    { title: capKw + ': Practical Guide' + brandSuffix, style: 'Comprehensive Guide' },
    { title: brand ? brand + ' | ' + capKw : capKw + ': Overview and Options', style: 'Brand-First' },
    { title: 'What Should You Know About ' + capKw + '?' + brandSuffix, style: 'Question & Solution' }
  ];

  const descOptions = [
    'Explore ' + kw + '. ' + detail + '. Learn what matters and review useful next steps.',
    verb + ' ' + kw + '. ' + detail + '. Find relevant information and make informed choices.',
    'Read a practical overview of ' + kw + '. ' + detail + '. Understand the essentials.',
    (brand ? 'Explore ' + kw + ' with ' + brand + '. ' : 'Explore the options for ' + kw + '. ') + detail + '.',
    'Questions about ' + kw + '? ' + detail + '. Review the details and common considerations.'
  ];

  const variants: MetaVariant[] = titleOptions.map((opt, i) => {
    const desc = descOptions[i] || descOptions[0];
    return {
      title: opt.title,
      description: desc,
      titleChars: opt.title.length,
      titlePixels: estimateTitlePixelWidth(opt.title),
      descChars: desc.length,
      style: opt.style
    };
  });

  const primaryVariant = variants[0];

  // Never output HTML-like tags from user input without escaping values.
  const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const safeTitle = escapeHtml(primaryVariant.title);
  const safeDesc = escapeHtml(primaryVariant.description);
  const safeUrl = escapeHtml(url);
  const htmlSnippet = `<!-- Primary Meta Tags -->
<title>${safeTitle}</title>
<meta name="title" content="${safeTitle}" />
<meta name="description" content="${safeDesc}" />
${safeUrl ? `<link rel="canonical" href="${safeUrl}" />` : ''}`;

  const ogSnippet = `<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
${safeUrl ? `<meta property="og:url" content="${safeUrl}" />` : ''}
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<!-- Supply your own real Open Graph image URL before publishing -->

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
${safeUrl ? `<meta name="twitter:url" content="${safeUrl}" />` : ''}
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<!-- Supply your own real Twitter image URL before publishing -->`;

  return {
    variants,
    htmlSnippet,
    ogSnippet,
    canonicalSnippet: url ? `<link rel="canonical" href="${url}" />` : undefined
  };
}
