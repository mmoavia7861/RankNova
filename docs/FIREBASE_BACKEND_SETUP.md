# RankNova: deploy JUST the SEO Audit API to Firebase Cloud Functions

**Goal:** Enable direct URL audits on the existing GitHub Pages site. Do NOT redeploy Firebase Hosting, reset Firestore, migrate Supabase, or alter owner login.

**Existing Firebase project:** `gen-lang-client-0081440357` (Default Gemini Project). The function `ranknovaApi` and its codebase `ranknova-api` already exist in this GitHub repository. Cloud Functions v2 uses Node 22, 512 MiB, max 2 instances and a 30-second timeout.

## Prerequisite: enable billing on THIS Firebase project

Go to https://console.firebase.google.com/project/gen-lang-client-0081440357/overview and upgrade to **Blaze**. The user's previous Google Cloud Shell error `BILLING_ACCOUNT_NOT_FOUND` is an actual blocker. **Cloud Functions cannot be deployed from Spark (free) without a linked billing account**. Blaze includes certain no-cost usage allowances but can incur charges. Budget alerts alone do not stop spend. Verify the correct Google Cloud project, budget alerts and available Cloud Run functions spend-cap controls.

## Cloud Shell (existing clone; no re-clone)

The user already cloned the repository into `~/RankNova/RankNova` (as shown by their Cloud Shell screenshot). In the existing Cloud Shell terminal, after billing is linked:

```bash
cd ~/RankNova/RankNova
git pull --ff-only origin main
gcloud config set project gen-lang-client-0081440357

node --version
# Node.js 22 or a currently supported Firebase CLI version runtime is needed.

npm --prefix functions install --no-audit --no-fund
npm --prefix functions run build
npm --prefix functions test
npm --prefix functions run test:http

npx --yes firebase-tools@latest login --no-localhost
npx --yes firebase-tools@latest projects:list

# IMPORTANT: only deploy THIS codebase. No Firebase Hosting or Firestore rules.
npx --yes firebase-tools@latest deploy --only functions:ranknova-api --project gen-lang-client-0081440357
```

If `firebase login` reports you are already signed in, `projects:list` should display the correct project. Never copy OAuth login tokens, passwords, billing information, or secrets into chat. If Cloud Shell asks to enable Cloud Run, Cloud Build, Artifact Registry or Eventarc APIs, confirm the correct project and billing first.

## Verify real function, not dummy data

The Firebase CLI prints an exact public **Function URL**, typically of the form:
`https://asia-south1-gen-lang-client-0081440357.cloudfunctions.net/ranknovaApi`

**The example above must NOT be assumed live:** use the actual URL printed by the deployed function.

Test with a browser:
```text
YOUR_EXACT_FUNCTION_URL/api/health
```

Expected response: JSON containing `"status": "ok"` and `"service": "ranknova-firebase-audit"`.

Then in Cloud Shell, replace `YOUR_EXACT_FUNCTION_URL`:
```bash
FUNCTION_URL='YOUR_EXACT_FUNCTION_URL'
curl -i "$FUNCTION_URL/api/health"
curl -i -X POST "$FUNCTION_URL/api/audit" \
  -H 'Origin: https://mmoavia7861.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

The second command must produce actual audit details (`checks`, `score`) or a clear error from the remote site. Verify a target such as `http://127.0.0.1/` is rejected. Functions rate limits are per instance and not globally enforced; add robust abuse protection before significant public traffic.

## Connect Firebase function to RankNova GitHub Pages

Open https://github.com/mmoavia7861/RankNova/settings/variables/actions

Add/update **repository variable** `RANKNOVA_API_BASE_URL` to the **exact printed Function URL**, including `/ranknovaApi`. Do not append `/api`, `/health` or `/audit`. It is a public endpoint, NOT a secret.

The frontend now accepts this direct Firebase Functions URL as well as normal HTTPS API origins. Existing Vite build workflow passes `RANKNOVA_API_BASE_URL` as `VITE_API_BASE_URL`.

Open https://github.com/mmoavia7861/RankNova/actions/workflows/deploy-pages.yml and choose **Run workflow** on `main`. Then visit https://mmoavia7861.github.io/RankNova/tools/seo-audit and test `https://example.com`. If necessary, hard refresh.

**Do not add Cloud Function keys or admin credentials to GitHub variables or the frontend.** This function is intended as a *public, rate-limited audit API*.

## Why function-only?

The Firebase project is called "Default Gemini Project" and may already host other content. Deploying `hosting` could change the site's content/rewrites. This runbook deploys only `functions:ranknova-api`, preserves GitHub Pages, avoids touching Firestore collections/rules, and gives a direct URL to connect.

## Limitations

- Firebase Blaze billing is **mandatory** for deployment.
- Cloud Functions return an audit for public HTML that the server can actually fetch, not for protected sites, blocked networks or pages requiring JavaScript rendering.
- A successful build/test does **not** prove that an authenticated deployment occurred. Verify the actual HTTPS health response.
- Optional `/api/search-grounding` remains unconfigured on this Firebase function.
