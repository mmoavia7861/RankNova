import React from 'react';
import { ArrowLeft, Clock, Calendar, User, ExternalLink } from 'lucide-react';
import { ARTICLES_DATA } from './GuidesPage';
import { AdSlot } from '../components/layout/AdSlot';

interface GuideDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const GuideDetailPage: React.FC<GuideDetailPageProps> = ({ slug, onNavigate }) => {
  const article = ARTICLES_DATA.find(a => a.slug === slug) || ARTICLES_DATA[0];

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

      {/* Article Body */}
      <div className="max-w-none text-slate-700 text-sm leading-relaxed space-y-6">
        <p className="text-base text-slate-800 font-medium leading-relaxed bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          {article.excerpt}
        </p>

        <h2 className="text-xl font-bold text-slate-900 pt-4">1. Understanding Modern Search Engine Behavior</h2>
        <p>
          Google Search Central guidelines consistently emphasize that technical metadata exists to assist automated crawlers in understanding document relevance and structural relationships. In contemporary search architecture, simplistic keyword stuffing or rigid character counting is insufficient.
        </p>

        <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 text-slate-700 text-xs space-y-2">
          <strong className="block text-sm font-bold text-blue-900">Google Search Central Insight</strong>
          <p className="leading-relaxed">
            Google does not enforce a hard limit on title tag length or meta description length. Snippets are truncated dynamically by rendered pixel width (approximately 600px on desktop and varying widths on mobile viewports). Furthermore, search algorithms dynamically extract text snippets from page content when the provided meta description does not directly match user search queries.
          </p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 pt-4">2. Core Implementation Strategy</h2>
        <p>
          To maintain high click-through rates (CTR) and prevent awkward truncation in search snippets, adhere to the following best practices:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-700">
          <li>
            <strong>Front-load target keywords:</strong> Place primary search terms within the first 35 characters to guarantee visibility across all device screens.
          </li>
          <li>
            <strong>Calculate pixel budgets:</strong> Wider capital characters (such as W, M, O) consume more pixel width than narrow letters (such as i, l, t). Keep total pixel width under ~580px.
          </li>
          <li>
            <strong>Include branded suffixes consistently:</strong> Append your organization name (e.g. <code>| Brand</code>) to reinforce brand recognition and credibility.
          </li>
          <li>
            <strong>Align with search intent:</strong> Ensure the promised value in the headline is immediately answered within the first paragraph and H1 heading of the page.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 pt-4">3. Recommended HTML Structure</h2>
        <div className="relative">
          <pre className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs font-mono text-emerald-300 overflow-x-auto shadow-md">
            <code>{`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Search Metadata -->
    <title>Primary Keyword - Action Benefit | Brand Name</title>
    <meta name="description" content="Engaging 130-155 character description summarizing key page solutions with clear call to action." />
    <link rel="canonical" href="https://example.com/canonical-page" />
    
    <!-- Open Graph for Social Networks -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Primary Keyword - Action Benefit | Brand Name" />
    <meta property="og:description" content="Engaging description for social previews." />
    <meta property="og:image" content="https://example.com/share-image.jpg" />
  </head>
  <body>
    <h1>Primary Keyword - Main Subject</h1>
    <!-- Page Content -->
  </body>
</html>`}</code>
          </pre>
        </div>

        <h2 className="text-xl font-bold text-slate-900 pt-4">4. Verification & Testing Tools</h2>
        <p>
          Always verify your implementations using real diagnostic checkers rather than manual guessing. You can use RankNova’s built-in tools:
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => onNavigate('/tools/seo-audit')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Run Website Audit
          </button>
          <button
            onClick={() => onNavigate('/tools/meta-tag-generator')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            Launch SERP Simulator
          </button>
          <button
            onClick={() => onNavigate('/tools/schema-generator')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            Generate JSON-LD Schema
          </button>
        </div>
      </div>

      {/* Ad slot */}
      <AdSlot slotId="guide-detail-bottom" />
    </article>
  );
};
