# Connect RankNova SEO Audit from GitHub Pages to Cloud Run

## Why GitHub Pages shows "frontend preview"
GitHub Pages only serves static HTML/JS/CSS. RankNova's Website SEO Audit calls `POST /api/audit`, implemented in Express `server.ts`. Without a separate running server, a real remote audit is impossible. **Never replace real audit results with generated scores.**

This repository supports two ways to run:
1. **Temporary preview:** GitHub Pages frontend + separate Cloud Run API, connected with a public HTTPS API base URL.
2. **Recommended final business site:** host the complete React + Express application together on Cloud Run (or equivalent full-stack hosting), ideally under a custom domain. This avoids cross-origin complexity and allows more reliable public SEO routing.

## Step 1 — Deploy a real backend (requires YOUR Google Cloud login and billing permissions)
Open Google Cloud Shell from the Google Cloud console, then run (choose your own project; replace `YOUR_PROJECT_ID`):

```bash
git clone https://github.com/mmoavia7861/RankNova.git
cd RankNova
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud run deploy ranknova-api \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --memory 1Gi \
  --timeout 30s \
  --set-env-vars "CORS_ALLOWED_ORIGINS=https://mmoavia7861.github.io,TRUST_PROXY_HOPS=1"
```

Cloud Run builds using `Dockerfile`. The resulting service URL is shown after successful deployment, e.g. `https://ranknova-api-xxxx.a.run.app`. That URL must be copied **exactly**, without adding `/api/audit` or a trailing path. Costs can apply, including Cloud Build/Artifact Registry and bandwidth. Set a billing budget and alerts.

**Check your deployed backend:**
- In a browser: `https://YOUR_SERVICE_URL/api/health` must return JSON with `"status":"ok"`.
- With a terminal:
```bash
curl -i https://YOUR_SERVICE_URL/api/health
curl -i -X POST https://YOUR_SERVICE_URL/api/audit \
  -H 'Origin: https://mmoavia7861.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```
A real report must contain a numeric `score` and a `checks` array. For the rejected URL `http://127.0.0.1/`, the server should return a safe validation error, not fetch it.

## Step 2 — Connect the GitHub Pages frontend
In `mmoavia7861/RankNova`, go to **Settings > Secrets and variables > Actions > Variables > New repository variable**.

- **Name:** `RANKNOVA_API_BASE_URL`
- **Value:** `https://YOUR_SERVICE_URL` (the Cloud Run HTTPS origin, no trailing path)

This is a public URL, **not** an API secret. Never place `GEMINI_API_KEY` or credentials in a Vite variable.

Run **Actions > Deploy RankNova frontend to GitHub Pages > Run workflow** after saving the variable (or push a new commit). Vite injects the variable at build time; changing the variable alone does not rebuild the website.

After deployment, visit `https://mmoavia7861.github.io/RankNova/tools/seo-audit`.
- The page checks `/api/health` at the configured Cloud Run origin.
- If healthy, the Analyze button unlocks and submits real audit requests.
- If the service is unavailable, a clear error is displayed. No fabricated scores are generated.
- A browser CORS failure generally means the backend's `CORS_ALLOWED_ORIGINS` is missing your public site's exact scheme and domain.

## Step 3 — Safety and production QA
- Set Firebase Authentication authorized domains for your production host.
- **Deploy and test** `firestore.rules` from the repository; a Git merge does NOT automatically update Firebase.
- Secure the public contact form against automated spam; client honeypots alone are insufficient.
- Backend CORS permits browsers from explicitly allowed origins, but **CORS is not API authentication or bot prevention**. Verify SSRF restrictions, rate limits, logs, cost controls and abuse monitoring before advertising the audit as a public free service.
- Optional Google Search grounding needs its server-side Gemini API configuration and separate verification. Keep its controls honest if the provider is unavailable.
- Test actual audits from multiple desktops/mobile browsers for valid sites, redirects, invalid domains, DNS errors, timeouts and 429 responses.
- This connection does not mean the site has passed an AdSense review. Do not claim approval.

## Custom domain later
For the strongest SEO setup, serve frontend and backend together from a full-stack host (such as Cloud Run). Review proper page-specific HTTP status codes, server-rendered/SSR or prerendered content, canonical links, sitemap paths, legal pages and HTTPS before applying for Google AdSense.

**Do not buy static-only hosting expecting it to execute `server.ts`.**
