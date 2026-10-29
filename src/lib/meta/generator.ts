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

  const currentYear = new Date().getFullYear();

  // 5 distinct headline styles
  const titleOptions: { title: string; style: MetaVariant['style'] }[] = [
    {
      title: `${capKw}: Complete Guide & Best Practices (${currentYear})${brandSuffix}`,
      style: 'Comprehensive Guide'
    },
    {
      title: `How to Master ${capKw} - Proven Step-by-Step Tips${brandSuffix}`,
      style: 'Action & Benefit'
    },
    {
      title: `${capKw} Explained: Everything You Need to Know${brandSuffix}`,
      style: 'Direct & Definitive'
    },
    {
      title: brand ? `${brand} ${capKw} - Fast, Reliable & Actionable` : `Top ${capKw} Strategies for Rapid Results (${currentYear})`,
      style: 'Brand-First'
    },
    {
      title: `Looking for ${capKw}? Here Is What Actually Works${brandSuffix}`,
      style: 'Question & Solution'
    }
  ];

  const descOptions = [
    `Explore essential ${kw} tips, key strategies, and actionable takeaways in this comprehensive breakdown. Learn how to optimize results today.`,
    `Discover how to effectively implement ${kw}. Follow proven techniques to boost rankings, increase visibility, and drive measurable growth.`,
    `Master ${kw} with our authoritative ${currentYear} overview. Find expert guidance, practical examples, and step-by-step instructions.`,
    brand
      ? `Get trusted ${kw} solutions from ${brand}. Improve your workflows and discover the highest-impact strategies for success.`
      : `Looking to succeed with ${kw}? Review clear guidance, avoid common pitfalls, and elevate your performance starting now.`,
    `Everything you need to know about ${kw}. Read the detailed breakdown, compare key approaches, and make informed decisions.`
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

  const htmlSnippet = `<!-- Primary Meta Tags -->
<title>${primaryVariant.title}</title>
<meta name="title" content="${primaryVariant.title}" />
<meta name="description" content="${primaryVariant.description}" />
${url ? `<link rel="canonical" href="${url}" />` : ''}`;

  const ogSnippet = `<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
${url ? `<meta property="og:url" content="${url}" />` : ''}
<meta property="og:title" content="${primaryVariant.title}" />
<meta property="og:description" content="${primaryVariant.description}" />
<meta property="og:image" content="https://example.com/social-share.jpg" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
${url ? `<meta name="twitter:url" content="${url}" />` : ''}
<meta name="twitter:title" content="${primaryVariant.title}" />
<meta name="twitter:description" content="${primaryVariant.description}" />
<meta name="twitter:image" content="https://example.com/social-share.jpg" />`;

  return {
    variants,
    htmlSnippet,
    ogSnippet,
    canonicalSnippet: url ? `<link rel="canonical" href="${url}" />` : undefined
  };
}
