import React from 'react';
import { ShieldCheck, Server, Globe2 } from 'lucide-react';
import { AdSlot } from '../components/layout/AdSlot';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Globe2 className="w-3.5 h-3.5 text-blue-600" />
          <span>About RankNova</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Transparent, Browser-First SEO Utilities
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          RankNova is an independent collection of SEO utilities. Our goal is to make page metadata and structured data easier to understand, while showing honest limitations for tools that require a separate server.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Our Core Engineering Principles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OWASP-Grade SSRF Defense</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When the audit backend is deployed, URL fetching uses defensive validation against private or internal destinations. The static GitHub Pages preview cannot perform live audits.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Transparent Scoring Rules</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              No black-box "authority metrics". We evaluate strict technical criteria: status codes, canonicals, robots tags, headings, and alt text.
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-900 pt-4">Data Privacy & Google Workspace</h2>
        <p>
          Optional Google Workspace features request permissions through Google's sign-in flow. Review the requested access carefully. These integrations require a properly configured Google project and supported services.
        </p>

        <h2 className="text-lg font-bold text-slate-900 pt-4">Contact & Support</h2>
        <p>
          For feedback, bug reports, or questions about the available tools, contact us through our{' '}
          <button onClick={() => onNavigate('/contact')} className="text-blue-600 hover:underline font-semibold cursor-pointer">
            Contact page
          </button>.
        </p>
      </div>

      <AdSlot slotId="about-bottom" />
    </div>
  );
};
