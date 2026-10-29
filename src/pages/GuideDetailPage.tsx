import React from 'react';
import { ArrowLeft, Clock, Calendar, User, ExternalLink } from 'lucide-react';
import { ARTICLES_DATA } from './GuidesPage';
import { AdSlot } from '../components/layout/AdSlot';

interface GuideDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}


interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

// Each guide contains independently written, topic-specific educational content.
const GUIDE_SECTIONS: Record<string, GuideSection[]> = {
  "title-tag-optimization-guide": [
    {
      "heading": "What a title tag does",
      "paragraphs": [
        "The title element describes the subject of a webpage. Search engines may use it as the clickable headline of a result, but they can also generate a different title from visible headings, anchor text or page content.",
        "Write for the reader first: explain the page accurately, distinguish it from other pages on your site, and avoid repeating the same keyword several times."
      ]
    },
    {
      "heading": "Length and display space",
      "paragraphs": [
        "Google does not prescribe a fixed number of characters for every title. A short title can still be replaced or truncated, and a long title can appear differently on mobile and desktop.",
        "Our preview uses a rough pixel-width estimate. It is a design aid, not a guarantee that Google will show the same headline."
      ],
      "bullets": [
        "Make the most important information understandable near the beginning.",
        "Write a distinct title for each indexable page.",
        "Avoid adding a year unless the page really is maintained for that year.",
        "Check mobile readability, then inspect actual Search Console performance once indexed."
      ]
    },
    {
      "heading": "Example and testing",
      "paragraphs": [
        "For a product page, a descriptive title such as 'Women's Trail Running Shoes | Brand' communicates the category and owner. A vague title such as 'Home | Brand' does not explain the page.",
        "Review your title together with the H1, meta description and on-page content. Google Search Console can show impressions and clicks; use those observations when refining titles rather than expecting a specific click-through rate."
      ]
    },
    {
      "heading": "Practical checklist",
      "bullets": [
        "Use only the topic that genuinely matches the page.",
        "Keep brand names accurate and concise.",
        "Verify the live document has one meaningful title element.",
        "Do not mistake the RankNova preview for an actual search ranking."
      ]
    }
  ],
  "schema-json-ld-mastery": [
    {
      "heading": "What JSON-LD is",
      "paragraphs": [
        "JSON-LD is a script-based format for expressing structured data. It can describe an article, product, local business or breadcrumb trail using Schema.org vocabulary.",
        "Structured data helps machines understand eligible page information, but Google decides whether any special search appearance is shown. Valid JSON alone does not guarantee rich results."
      ]
    },
    {
      "heading": "Choose the correct type",
      "bullets": [
        "Article: use real headline, author and publication details for editorial content.",
        "Product: use authentic product information and offers. Never invent prices, reviews or star ratings.",
        "LocalBusiness: use verifiable business address, website and contact details.",
        "BreadcrumbList: list only the visible navigation hierarchy with correct URLs."
      ]
    },
    {
      "heading": "Build and validate",
      "paragraphs": [
        "Start with one page that has a clear purpose. In RankNova, select the schema type, enter your real values, and examine the generated script before copying it into the page HTML.",
        "Run the published URL or markup through Google's Rich Results Test. The test checks Google-supported rich-result requirements; Schema.org validation can provide another perspective on syntax and vocabulary."
      ]
    },
    {
      "heading": "Common errors to avoid",
      "bullets": [
        "Adding review ratings that were never collected.",
        "Marking up content users cannot see on the page.",
        "Using fictional business addresses or placeholder example.com URLs.",
        "Copying a script without checking required fields and the final live page."
      ]
    }
  ],
  "technical-seo-audit-checklist": [
    {
      "heading": "Start with access and indexability",
      "paragraphs": [
        "Visit the live URL with a browser, then inspect the HTTP status code. A broken page, incorrect redirect or blocked document can prevent a search engine from discovering or indexing the intended content.",
        "Examine robots.txt, robots meta directives and the canonical URL separately. A canonical is a preference signal, not an unconditional instruction."
      ]
    },
    {
      "heading": "Review on-page structure",
      "bullets": [
        "Give the page one descriptive title element and a useful meta description.",
        "Write an H1 that describes the primary page topic; keep subsequent headings logical.",
        "Add helpful alt text for images that convey meaning, and use empty alt for purely decorative ones.",
        "Link to important pages using understandable anchor text.",
        "Check structured data against actual page content."
      ]
    },
    {
      "heading": "Check mobile and page experience",
      "paragraphs": [
        "Make sure the layout is readable on smaller screens and navigation can be used without precision tapping. Verify there is a responsive viewport tag and that content does not overflow.",
        "Core Web Vitals require field or lab measurements; a single HTML fetch cannot measure real-user LCP, INP and CLS. Consult PageSpeed Insights or Search Console rather than treating a custom audit score as a Google performance score."
      ]
    },
    {
      "heading": "Understand what RankNova tests",
      "paragraphs": [
        "RankNova's server-side audit checks selected visible HTML and response attributes using documented rules. It is not a site-wide crawl, backlink analysis or ranking prediction.",
        "On GitHub Pages only the static frontend is hosted. The audit requires a separate running backend and should not be described as available until that service is deployed and tested."
      ]
    }
  ],
  "meta-description-best-practices": [
    {
      "heading": "The role of meta descriptions",
      "paragraphs": [
        "A meta description is a suggested summary of the page. Search engines may choose this text for a search result, or extract a different snippet from the page to suit a particular query.",
        "A relevant description can help a reader decide whether to click. It is not a direct guarantee of improved ranking or click-through rate."
      ]
    },
    {
      "heading": "Write a clear and honest summary",
      "bullets": [
        "Explain what the user will find or accomplish on the page.",
        "Use the main topic naturally, without keyword lists.",
        "Avoid made-up promises such as guaranteed rank improvements.",
        "Keep descriptions different for pages serving different needs.",
        "When appropriate, include a straightforward next action."
      ]
    },
    {
      "heading": "Length is an approximation",
      "paragraphs": [
        "There is no single permanent character limit that guarantees full display. Screen width, search features, the search query and Google's selected snippet all affect the result.",
        "Aim for a concise, informative description and use the RankNova preview only as an approximation. A description that is slightly longer may be more useful than a shorter one that omits important context."
      ]
    },
    {
      "heading": "Measure and iterate",
      "paragraphs": [
        "Use Google Search Console to compare queries and pages before making changes. Review the actual rendered snippet in search, not just what the HTML tag contains.",
        "If a page receives impressions but few clicks, investigate its search intent, title, snippet and competing results together. Avoid attributing all changes in traffic to one metadata edit."
      ]
    }
  ]
};

export const GuideDetailPage: React.FC<GuideDetailPageProps> = ({ slug, onNavigate }) => {
  const article = ARTICLES_DATA.find(a => a.slug === slug);
  const sections = GUIDE_SECTIONS[slug];
  if (!article || !sections) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Guide not found</h1><button onClick={() => onNavigate('/guides')} className="mt-4 text-blue-600 underline">Back to guides</button></div>;
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => onNavigate('/guides')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Guides</span>
        </button>
      </div>

      {/* Article Header */}
      <header className="space-y-4 pb-6 border-b border-slate-200">
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          {article.category}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {article.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {article.publishedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {article.readTime}
          </span>
        </div>
      </header>

      {/* Topic-specific article content; no generic duplicate body reused across guides. */}
      <div className="max-w-none text-slate-700 text-sm leading-relaxed space-y-7">
        <p className="text-base text-slate-800 font-medium leading-relaxed bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          {article.excerpt}
        </p>
        {sections.map((section, index) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">{index + 1}. {section.heading}</h2>
            {section.paragraphs?.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul className="list-disc pl-5 space-y-2">
                {section.bullets.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
        <aside className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
          <h2 className="font-bold text-slate-900">Useful official references</h2>
          <p>Check the latest documentation when implementing SEO changes.</p>
          <a className="text-blue-700 font-semibold underline block" href="https://developers.google.com/search/docs" target="_blank" rel="noopener noreferrer">
            Google Search Central documentation <ExternalLink className="w-3.5 h-3.5 inline" />
          </a>
          <a className="text-blue-700 font-semibold underline block" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">
            Google Rich Results Test <ExternalLink className="w-3.5 h-3.5 inline" />
          </a>
        </aside>
        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={() => onNavigate('/tools/meta-tag-generator')} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold">Try Meta Tag Generator</button>
          <button onClick={() => onNavigate('/tools/schema-generator')} className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold">Try Schema Generator</button>
        </div>
      </div>

      {/* Ad slot */}
      <AdSlot slotId="guide-detail-bottom" />
    </article>
  );
};
