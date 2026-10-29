import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-slate-700 text-sm leading-relaxed">
      <header className="space-y-2 pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500">Effective Date: October 29, 2026</p>
      </header>

      <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using RankNova ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms, please refrain from using the tools.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Acceptable Use Policy</h2>
          <p>
            You agree to use RankNova exclusively for legitimate diagnostic, educational, and website optimization purposes. You must not:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Attempt to audit internal network addresses (RFC1918), localhost interfaces, or cloud metadata endpoints.</li>
            <li>Initiate automated denial-of-service (DoS) or flood requests against target websites through our audit endpoint.</li>
            <li>Circumvent rate limits, IP guards, or authentication gates.</li>
            <li>Use the Service to transmit malicious code or spoof digital credentials.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Intellectual Property</h2>
          <p>
            All generated code snippets, meta tag suggestions, and Schema.org JSON-LD templates produced for your inputs are licensed to you for free, unencumbered commercial and non-commercial use on your websites.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Limitation of Liability</h2>
          <p>
            RankNova is provided on an "as is" and "as available" basis without warranties of any kind. Under no circumstances shall RankNova be liable for indirect, incidental, or consequential damages resulting from algorithmic search ranking changes, server downtimes, or implementation errors.
          </p>
        </section>
      </div>
    </div>
  );
};
