# RankNova — prelaunch release checklist

This is a **code-readiness worklist**, not a certificate that the business website has no bugs. No team can promise zero errors. Do not buy a hosting plan because a frontend build alone is green.

## Current architecture
- GitHub Pages hosts only the Vite/React static preview at `https://mmoavia7861.github.io/RankNova/`.
- The Website SEO Audit and optional Gemini search-grounding require `server.ts` on Node hosting, with appropriate environment and rate limits. They cannot run on GitHub Pages.
- Meta Tag and Schema Generators run locally, but still require browser validation and manual QA.
- The staged new CMS uses Supabase Auth and PostgreSQL RLS. Apply SQL schema, verify owner UUID, and test RLS and Google OAuth before merging.
- Published articles are shown from Supabase when connected; built-in guides work without a database.
- AdSense ad serving and a certified CMP have **not** been implemented or approved. The admin switches are only saved configuration values.

## Must complete before purchasing hosting or applying for AdSense
- [ ] Decide whether RankNova stays an SEO utilities business; do not mix PDF tools into this repository unintentionally.
- [ ] Deploy to a full-stack host compatible with `server.ts`, e.g., a Node runtime on Cloud Run. Configure production secrets in environment variables, never in Git.
- [ ] Verify the API health endpoint and real audit requests from the public site. Test valid, invalid, redirects, IPv4/IPv6, blocked private URLs, and rate limits.
- [ ] Verify Supabase Google Auth provider and permitted redirect URLs for the final origin.
- [ ] Apply PostgreSQL schema from `supabase/migrations` in the correct Supabase project. Prove RLS protects settings, feedback and drafts from non-owner users.
- [ ] Enable server-verified CAPTCHA or WAF rate limiting for anonymous feedback. SQL per-email limits and a honeypot are insufficient alone.
- [ ] Submit contact form and confirm it appears only to the owner in Supabase PostgreSQL.
- [ ] Create an original CMS article in the admin interface and verify the public guide list and details show the published content; test unpublished content stays private.
- [ ] Enter a deliberately malformed URL in Meta Generator and verify there is no blank screen.
- [ ] Test Schema Generator on each type: blank fields, invalid URLs, valid article, product, local business and breadcrumb data; verify copied JSON-LD with official tools.
- [ ] Review and approve the actual public About, Contact, Privacy, Terms and Disclaimer text with real business/contact details; do not publish invented addresses or mailboxes.
- [ ] Configure a canonical production domain and proper HTTPS; update SEO metadata, canonical, social image and sitemap host.
- [ ] Ensure every indexable URL returns HTTP 200 with appropriate rendered content (GitHub Pages SPA fallbacks can show pages with HTTP 404 to crawlers).
- [ ] Check sitemap.xml, robots.txt, titles, canonical URLs, accessibility and mobile performance. Keep private admin routes noindexed.
- [ ] Integrate AdSense only after account approval, with compliant ad placements and jurisdiction-appropriate certified consent management where required. Admin status is not evidence of approval.
- [ ] Run `npm run lint`, `npm test`, and `npm run build` in CI. Also manually test mobile Chrome/Safari and desktop browsers.
- [ ] Take a backup, set alerts and error monitoring, then make a staged production release.

## Domain/hosting decision
A domain can be bought separately. Do not pay for a static-only hosting plan if the SEO Audit is expected to work; it needs a managed Node backend. Confirm hosting limits, billing, DNS, TLS, deployment strategy and rollback plan first.

**Security note:** Owner authorization requires the verified Supabase Auth UUID in private `admin_users`; PostgreSQL RLS enforces permissions. Frontend hiding alone is insufficient.
