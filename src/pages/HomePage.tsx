import React from 'react';
import {
  Search,
  Code2,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { AdSlot } from '../components/layout/AdSlot';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 text-center">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-indigo-50/20 to-transparent -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-center mb-4">
            <img
              src={`${import.meta.env.BASE_URL}assets/aistudio/RankNova_Growth_Analytics_Logo_037f0c19.png`}
              alt="RankNova"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>High-Intent SEO Platform • Zero Paywalls</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Diagnose Technical SEO.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
              Maximize Organic Visibility.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Run instant on-page diagnostic audits, engineer high-CTR title and meta tags with real Google SERP simulation, and generate valid Schema.org structured data in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/tools/seo-audit')}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Launch SEO Audit</span>
            </button>
            <button
              onClick={() => onNavigate('/tools/meta-tag-generator')}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Meta Tag Generator</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </section>

      {/* The 3 Core Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            The 3 High-Impact SEO Utilities
          </h2>
          <p className="text-sm text-slate-600">
            A cohesive product loop: diagnose technical issues, rewrite your SERP snippets, and deploy structured data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tool 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Website SEO Audit Checker
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Server-side page crawler with OWASP-grade SSRF protection. Audits status codes, canonicals, robots tags, H1-H3 hierarchy, image alt coverage, Open Graph, and response timing.
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transparent 0–100 proprietary scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Actionable code snippets for every fix</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email report via Gmail & Keep notes</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('/tools/seo-audit')}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Run SEO Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Meta Tag Generator & SERP Preview
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Engineer click-worthy title tags and meta descriptions. Includes accurate desktop & mobile Google snippet simulators, ~600px pixel width gauge, and live Google Search grounding.
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5 distinct headline strategy templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exact desktop & mobile SERP preview</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open Graph & Twitter card generation</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('/tools/meta-tag-generator')}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Generate Meta Tags</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Schema JSON-LD Generator
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate Schema.org JSON-LD structured data for Articles, Products, Local Businesses, and Breadcrumbs. Live syntax validation and direct link to Google's official Rich Results Test.
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Strict Schema.org property types</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Required & recommended field checker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-click copy & .jsonld file download</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('/tools/schema-generator')}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Create Schema Markup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Zero Slop • High-Assurance Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Engineered for Accuracy & Security
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Unlike bloated tools that fabricate estimates or sell your domains, RankNova operates on pure, transparent technical logic. Every outbound fetch undergoes strict DNS resolution, RFC1918 private network exclusion, and per-redirect IP validation.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5 font-bold">Core Web Vitals</strong>
                  <span className="text-slate-600">Targeting LCP ≤ 2.5s, INP &lt; 200ms, CLS &lt; 0.1</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5 font-bold">Privacy First</strong>
                  <span className="text-slate-600">No URL query parameters logged to analytics</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 font-mono text-xs space-y-3 shadow-md">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span>security_guard.ts</span>
                <span className="text-emerald-400 font-semibold">STATUS: ACTIVE</span>
              </div>
              <p className="text-slate-300">
                [OK] Host resolved: public A/AAAA records verified
              </p>
              <p className="text-slate-300">
                [OK] Private range check: RFC1918 / loopback rejected
              </p>
              <p className="text-slate-300">
                [OK] Redirect guard: each destination inspected
              </p>
              <p className="text-emerald-400 font-semibold">
                [200 OK] Safe outbound fetch completed in 240ms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured SEO Guides Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Educational SEO Guides</h3>
            <p className="text-xs text-slate-500">Original, in-depth technical documentation</p>
          </div>
          <button
            onClick={() => onNavigate('/guides')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div
            onClick={() => onNavigate('/guides/title-tag-optimization-guide')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2"
          >
            <span className="text-[10px] font-bold uppercase text-blue-600">SERP Strategy</span>
            <h4 className="text-sm font-bold text-slate-900">The Definitive Guide to Title Tag Length & Pixel Limits</h4>
            <p className="text-slate-600">
              Why 60 characters is a guideline, not a Google rule, and how to calibrate for desktop and mobile pixel limits.
            </p>
          </div>

          <div
            onClick={() => onNavigate('/guides/schema-json-ld-mastery')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2"
          >
            <span className="text-[10px] font-bold uppercase text-indigo-600">Structured Data</span>
            <h4 className="text-sm font-bold text-slate-900">Schema.org JSON-LD Implementation for Rich Results</h4>
            <p className="text-slate-600">
              Detailed guide covering Article, Product, LocalBusiness, and BreadcrumbList markup standards.
            </p>
          </div>

          <div
            onClick={() => onNavigate('/guides/technical-seo-audit-checklist')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2"
          >
            <span className="text-[10px] font-bold uppercase text-blue-600">Technical Audit</span>
            <h4 className="text-sm font-bold text-slate-900">On-Page Technical SEO Checklist & Core Web Vitals</h4>
            <p className="text-slate-600">
              Essential checklist for status codes, canonicals, robots meta tags, heading hierarchies, and image alt text.
            </p>
          </div>
        </div>
      </section>

      {/* Compliant Ad Slot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot slotId="home-bottom" />
      </div>
    </div>
  );
};
