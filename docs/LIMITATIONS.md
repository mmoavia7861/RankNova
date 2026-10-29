# Known Technical Limitations & Design Decisions

## 1. Static HTML vs. Client-Side JavaScript Execution
- **Decision:** The Website SEO Audit Checker parses raw initial HTML via `node-html-parser`. It does not execute client-side JavaScript or run Headless Chromium.
- **Rationale:** Executing untrusted third-party JavaScript on the server introduces extreme compute overhead, memory leaks, and sandbox escape vulnerabilities. Modern search engine crawlers prioritize server-rendered HTML for indexing.

## 2. Google Keep API Enterprise Constraint
- **Constraint:** The Google Keep API (`keep.googleapis.com`) is an enterprise-only Workspace service requiring domain-wide delegation in Google Workspace Admin. Standard consumer `@gmail.com` accounts receive a 403 authorization error upon direct REST invocation.
- **Solution:** RankNova provides an interactive Keep Note Generator and 1-click launcher to `https://keep.google.com/` with structured checklist markdown so users can manage tasks without enterprise service account credentials.

## 3. SEO Score Interpretation
- **Policy:** The 0–100 score is a proprietary diagnostic measure developed by RankNova. It does not reflect Google Search internal ranking algorithms, which consider off-page backlinks, historical click signals, and query freshness.
