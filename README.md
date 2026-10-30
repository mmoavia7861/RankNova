# RankNova - Professional SEO Tools & Growth Analytics

RankNova is an evolving SEO-tools project built with React, TypeScript, an optional Express API and a staged Supabase PostgreSQL migration. Production readiness depends on environment configuration, security testing and hosting.

## The 3 Core Public SEO Tools

1. **Website SEO Audit Checker (`/tools/seo-audit`)**
   - Server-side page diagnostics with OWASP-grade SSRF defense.
   - Evaluates HTTP status code, title tag, meta description, canonical, robots directives, viewport, H1–H3 hierarchy, image alt text coverage, internal/external links, Open Graph, and Schema.org structured data.
   - Transparent 0–100 proprietary scoring with letter grades (A+ to F).
   - Google Workspace actions: Dispatch report via **Gmail** and export action checklist to **Google Keep**.

2. **Meta Tag Generator & SERP Preview (`/tools/meta-tag-generator`)**
   - Generate 5 distinct title and description strategies with pixel width counters (~600px max) and character limits.
   - Interactive live **desktop & mobile Google search snippet preview**.
   - Optional **Google Search Grounding** powered by Gemini 3.8 Flash (`models/gemini-3.8-flash`) to analyze live competitor snippet patterns and real-time search trends.
   - 1-click copy for `<head>` code, `<title>`, meta description, and Open Graph cards.

3. **Schema JSON-LD Markup Generator (`/tools/schema-generator`)**
   - Supports 4 key Schema.org templates: `Article`, `Product`, `LocalBusiness`, and `BreadcrumbList`.
   - Real-time syntax validation with required/recommended field feedback.
   - Live JSON-LD script preview, 1-click copy, and `.jsonld` file download.
   - Direct integration link to Google's official **Rich Results Test**.

## Security & Architectural Highlights

- **SSRF Hardening:** Strict URL scheme parsing, credential blocking, DNS A/AAAA record resolution, RFC1918 private IP rejection, cloud metadata (`169.254.169.254`) blocking, and per-redirect destination validation.
- **Supabase Auth & PostgreSQL:** Google sign-in and owner-only CMS access controlled by PostgreSQL Row Level Security. The migration is staged and must be verified before release.
- **Google Workspace APIs:** Gmail API (`users.messages.send`) and Google Forms API (`forms.body`) with in-memory access token caching and user confirmation gates.
- **AdSense:** Approval, live ad serving and consent management have not been configured or verified.
- **SEO & Core Web Vitals:** Pre-rendered HTML metadata for all public routes, dynamic `/sitemap.xml`, and `/robots.txt`.

## Getting Started

```bash
# Install dependencies
npm install

# Start full-stack development server
npm run dev

# Run security and schema tests
npm test

# Build for production
npm run build
```

## Documentation
- [Security & SSRF Threat Model](docs/SECURITY.md)
- [AdSense & CMP Setup](docs/ADSENSE.md)
- [Operations & Cloud Run Runbook](docs/OPERATIONS.md)
- [Known Limitations](docs/LIMITATIONS.md)
- [Staged Firebase-to-Supabase migration](docs/SUPABASE_MIGRATION.md)
