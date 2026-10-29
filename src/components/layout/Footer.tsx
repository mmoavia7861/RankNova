import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/assets/aistudio/RankNova_Growth_Analytics_Logo_037f0c19.png"
                alt="RankNova"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              High-intent, transparent SEO diagnostics and markup utilities. Built browser-first, fortified with SSRF protections, and integrated with Google Workspace.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OWASP-Grade SSRF Defense</span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              SEO Utilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/tools/seo-audit')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Website SEO Audit Checker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tools/meta-tag-generator')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Meta Tag Generator & SERP Preview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tools/schema-generator')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Schema JSON-LD Markup Generator
                </button>
              </li>
              <li>
                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
                >
                  Google Rich Results Test <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Educational Guides */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Guides & Education
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/guides')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  SEO Education Hub
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/guides/title-tag-optimization-guide')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Title Tag Pixel & CTR Optimization
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/guides/schema-json-ld-mastery')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Schema.org JSON-LD Implementation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/guides/technical-seo-audit-checklist')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  On-Page Technical Audit Checklist
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policy */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  About RankNova
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy-policy')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/disclaimer')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Methodology & Disclaimer
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer note */}
        <div className="pt-8 border-t border-slate-100 text-xs text-slate-500 leading-relaxed space-y-2">
          <p>
            <strong className="text-slate-700">Important Disclaimer:</strong> RankNova scores (0–100) are custom, rule-based diagnostic assessments calculated from on-page technical standards. They are <strong className="text-slate-700">not official Google rankings or Google search metrics</strong>. Search engines employ hundreds of private algorithmic signals; compliance with technical best practices improves crawlability and user experience but does not guarantee specific ranking placement or rich result display.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 pt-4">
            <p>&copy; {new Date().getFullYear()} RankNova Analytics. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="/sitemap.xml" className="hover:text-slate-700">XML Sitemap</a>
              <a href="/robots.txt" className="hover:text-slate-700">robots.txt</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
