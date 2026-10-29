import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-slate-700 text-sm leading-relaxed">
      <header className="space-y-2 pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: October 29, 2026</p>
      </header>

      <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Introduction & Overview</h2>
          <p>
            RankNova ("we", "our", or "us") provides web-based technical SEO diagnostic tools, meta tag generators, and Schema.org structured data creators. This Privacy Policy details our data collection, processing, and protection practices in compliance with Google publisher requirements and global data privacy standards (GDPR, CCPA).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Information We Process</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>
              <strong>Public URLs Submitted for Audit:</strong> When you run an SEO audit, our server fetches the target URL in a secure sandbox. We do not store or sell the target URLs submitted by public users.
            </li>
            <li>
              <strong>Google Workspace Data:</strong> If you connect Google Workspace (Gmail or Google Forms), OAuth access tokens are held strictly in temporary browser memory. We never store your emails, form responses, or Google passwords.
            </li>
            <li>
              <strong>Feedback & Inquiries:</strong> If you contact us, we store your name, email, and message in Firestore to respond to your inquiry.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Third-Party Services & Google Advertising</h2>
          <p>
            Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
          </p>
          <p>
            Users may opt out of personalized advertising by visiting Google's <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ads Settings</a> or by using the Digital Advertising Alliance's <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">opt-out facility</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Consent Management Platform (CMP) for EEA / UK</h2>
          <p>
            For users located in the European Economic Area (EEA), United Kingdom, and Switzerland, RankNova integrates a Google-certified Consent Management Platform (CMP) adhering to the IAB Europe Transparency and Consent Framework (TCF) to collect and manage user consent for cookies and personalized ads.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Security & SSRF Safeguards</h2>
          <p>
            We implement industry-standard security measures, including IP/DNS verification, automated rate limiting, and strict input validation to defend against Server-Side Request Forgery (SSRF) and data interception.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">6. Contacting Us</h2>
          <p>
            If you have questions regarding this Privacy Policy or your data rights, please contact our privacy compliance officer via our Contact page or at <code>privacy@ranknova.app</code>.
          </p>
        </section>
      </div>
    </div>
  );
};
