import React from 'react';
import { BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { AdSlot } from '../components/layout/AdSlot';

interface GuidesPageProps {
  onNavigate: (path: string) => void;
}

export interface GuideArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
}

export const ARTICLES_DATA: GuideArticle[] = [
  {
    slug: 'title-tag-optimization-guide',
    title: 'The Definitive Guide to Title Tag Length, Pixels, and CTR in Modern SEO',
    excerpt: 'Google does not have a strict character limit for title tags—snippets are truncated by pixel width. Learn how to calculate pixel budgets and structure titles for maximum click-through rates.',
    category: 'On-Page SEO',
    readTime: '6 min read',
    publishedDate: 'October 2026',
    author: 'RankNova Technical Team'
  },
  {
    slug: 'schema-json-ld-mastery',
    title: 'Mastering Schema.org JSON-LD: Structured Data for Google Rich Results',
    excerpt: 'Understand how Google processes JSON-LD, why correct markup does not guarantee a rich snippet, and step-by-step implementation for Article, Product, LocalBusiness, and BreadcrumbList.',
    category: 'Structured Data',
    readTime: '8 min read',
    publishedDate: 'October 2026',
    author: 'RankNova Technical Team'
  },
  {
    slug: 'technical-seo-audit-checklist',
    title: 'The Complete On-Page Technical SEO Audit Checklist for 2026',
    excerpt: 'A comprehensive engineering guide to indexability, canonical link tags, heading hierarchy, image accessibility, and server response time metrics.',
    category: 'Technical Audits',
    readTime: '7 min read',
    publishedDate: 'October 2026',
    author: 'RankNova Technical Team'
  },
  {
    slug: 'meta-description-best-practices',
    title: 'Meta Description Strategy: Writing Snippets That Outperform in SERPs',
    excerpt: 'Why Google frequently rewrites meta descriptions, how to align with user search intent, and balancing character limits between desktop and mobile devices.',
    category: 'Content Strategy',
    readTime: '5 min read',
    publishedDate: 'October 2026',
    author: 'RankNova Technical Team'
  }
];

export const GuidesPage: React.FC<GuidesPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Technical SEO Knowledge Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          SEO Guides & Technical Documentation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Deep, evidence-backed technical articles covering search engine crawling, structured data validation, metadata engineering, and Core Web Vitals optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ARTICLES_DATA.map((article) => (
          <div
            key={article.slug}
            onClick={() => onNavigate(`/guides/${article.slug}`)}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {article.readTime}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 mt-4">
              <span>{article.author} • {article.publishedDate}</span>
              <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Ad slot */}
      <AdSlot slotId="guides-hub-bottom" />
    </div>
  );
};
