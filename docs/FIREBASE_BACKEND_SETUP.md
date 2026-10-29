# Deploy RankNova Website SEO Checker with Firebase

This config adds a **real Firebase Cloud Functions (2nd gen) backend** running the existing `runSeoAudit` implementation. Firebase Hosting routes `/api/health` and `/api/audit` to `ranknovaApi`. The other two public SEO generators remain browser-based. Optional Gemini live-search endpoint explicitly returns 503 until configured.

**IMPORTANT:** GitHub code changes cannot independently deploy to your Firebase account. You must sign into the Google account with edit permissions for YOUR Firebase project. Firebase Cloud Functions requires the Blaze pay-as-you-go plan, which may incur charges. Set budget alerts, monitor costs, and apply bot protections before opening the public service at scale.

## Choose the correct Firebase project first

This existing frontend currently references Firebase project `gen-lang-client-0081440357` and a separate named Firestore database. Do **not** create a different project accidentally or overwrite its live database/rules. Confirm in the Firebase console that you own or can administer that project. If you prefer another project, first update the frontend configuration deliberately.

## Setup in a trusted local terminal or Cloud Shell

1. Ensure Node.js 22 and the Firebase CLI are available.
2. Authenticate interactively using `firebase login` (never share account password).
3. Choose and verify the correct project and upgrade to Blaze as required.
4. In your checkout:

```bash
git clone https://github.com/mmoavia7861/RankNova.git
cd RankNova
npm install
npm --prefix functions install
npm --prefix functions run build
npm --prefix functions test
npm run build
firebase projects:list
```

To allow a custom domain later, add the exact HTTPS frontend domains to Firebase function configuration as environment variables. Create `functions/.env` on YOUR machine (gitignored):

```
RANKNOVA_ALLOWED_ORIGINS=https://mmoavia7861.github.io,https://YOUR_PROJECT_ID.web.app,https://YOUR_PROJECT_ID.firebaseapp.com
```

**Do not put credentials, API keys or private tokens in this file or into `VITE_*` frontend variables.**

Deploy **only this app's functions codebase and Hosting** to your verified project:

```bash
firebase deploy --only functions:ranknova-api,hosting --project YOUR_PROJECT_ID
```

The deployment should print a hosting URL like `https://YOUR_PROJECT_ID.web.app`. Confirm:

```bash
curl -i https://YOUR_PROJECT_ID.web.app/api/health
curl -i -X POST https://YOUR_PROJECT_ID.web.app/api/audit \
  -H 'Origin: https://mmoavia7861.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

Expect an actual report with numeric `score`, a `checks` array and timestamp. Test `http://127.0.0.1/` as an input and confirm that the server refuses it. Check rate limits and failed request messages.

## Keep GitHub Pages for your current public frontend (optional)

After Firebase Hosting + Functions is deployed and the health endpoint works, go to:

[RankNova GitHub Actions Variables](https://github.com/mmoavia7861/RankNova/settings/variables/actions)

Create or update the repository variable:
- **Name:** `RANKNOVA_API_BASE_URL`
- **Value:** `https://YOUR_PROJECT_ID.web.app`

Do NOT add `/api`, `/api/audit` or trailing paths. Then manually rerun **Deploy RankNova frontend to GitHub Pages** under GitHub Actions so Vite bakes that public URL into the frontend. Once the real API health check succeeds from the browser, the SEO Audit button unlocks. No score is shown before a real audit.

You can alternatively serve the entire frontend on Firebase Hosting at `https://YOUR_PROJECT_ID.web.app` and skip GitHub Pages. The API works on the same origin there and can be connected to your eventual custom domain.

## What stays separate

- **Firestore security rules:** Existing `firestore.rules` target owner-only CMS/feedback in a *named* database. This `firebase.json` intentionally does not auto-deploy Firestore rules, preventing accidental overwrite of another database's rules. Deploy only after reviewing the target database and Firebase rules syntax.
- **Contact form:** Currently uses Firestore directly. Needs abuse protection and verification.
- **Admin authentication:** Must be tested with authorized owner account and unrelated accounts, and the authorized domain configured in Firebase Auth.
- **SEO / AdSense:** Firebase Hosting's SPA fallback may not deliver individually server-rendered HTML on deep links; review indexing/SSR before launch. AdSense approval is not guaranteed.
- **Security & billing:** The Function is public because anyone should be able to check a website without signing in. Instance-limited in-memory rate limits are not globally enforced. Deploy additional verified anti-abuse/App Check or WAF controls, DNS-rebinding-safe outbound networking, cost monitoring and adequate security tests before public high-traffic use.

**At this stage, successful CI is not evidence of deployment to your account or a production-safe public release.**
