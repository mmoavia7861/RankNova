import React from 'react';

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-slate-700 text-sm leading-relaxed">
    <header className="space-y-2 pb-6 border-b border-slate-200">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last revised: October 30, 2026 • RankNova</p>
    </header>
    <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">What RankNova offers</h2>
        <p>RankNova provides an SEO audit interface, browser-based meta-tag and structured-data generators, and educational guides. This policy describes the current application and must be reviewed again when a new domain, backend, analytics service, or advertising provider is activated.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">Information you provide</h2>
        <p><strong>Contact messages:</strong> If the contact form successfully connects to Supabase PostgreSQL, it saves the name, email address, subject, message, and submission timestamp you enter. The website owner can review and delete these records in the admin interface. The form does not automatically send an email.</p>
        <p><strong>SEO audit URLs:</strong> The server-side audit feature, when deployed, requests the public webpage URL you submit and analyzes its HTML. The current GitHub Pages preview cannot run this service. The server or hosting platform may temporarily record request information in operational logs; do not enter private URLs, access tokens or credentials.</p>
        <p><strong>Generated tags and schema:</strong> The Meta Tag and Schema Generators process entered form values in your browser. These tools do not require you to sign in.</p>
        <p><strong>Owner login and optional Workspace actions:</strong> Supabase Authentication handles Google sign-in. If someone explicitly authorizes optional Google Workspace features, Google processes the OAuth permissions requested by those actions. Do not grant access unless you understand the scope shown by Google.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">Hosting, storage, retention and security</h2>
        <p>GitHub Pages serves the current static website. Supabase Authentication and PostgreSQL are operated by Supabase when configured. Contact records remain in PostgreSQL until the owner deletes them; no automatic deletion period is currently promised. We use PostgreSQL Row Level Security policies to restrict administrative data access, but their deployment must be verified in the Firebase project before launch.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">Analytics, cookies and advertising</h2>
        <p>AdSense ads and a Google-certified consent management platform (CMP) are not currently confirmed as active on the preview. If these services are enabled later, this policy and consent controls must be updated before visitors are served advertising or non-essential tracking where consent is required. Browser and Google authentication services may use necessary cookies or similar technology.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">Questions and deletion requests</h2>
        <p>For questions about data or to request deletion of a contact submission, use our <a className="text-blue-700 underline" href={`${import.meta.env.BASE_URL}contact`}>Contact page</a>. Please provide enough information to locate the submission without sending sensitive documents. Response times are not guaranteed.</p>
      </section>
      <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">This description must be reviewed with your final hosting, privacy and AdSense configuration before commercial launch. It is not a certification of legal compliance.</p>
    </div>
  </div>
);
