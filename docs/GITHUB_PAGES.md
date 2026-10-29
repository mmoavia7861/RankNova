# RankNova GitHub Pages setup

GitHub Pages URL: https://mmoavia7861.github.io/RankNova/

This repository is a **full-stack React + Express application**, not just a static site. GitHub Pages can host only a **frontend preview**. It cannot run Express `server.ts`, the Website SEO Audit endpoint (`POST /api/audit`), or Gemini search-grounding (`POST /api/search-grounding`). The meta-tag and JSON-LD utilities may work as browser-only features; validate them before calling the site production-ready.

## Publish the frontend preview

1. Merge the GitHub Pages PR into `main`.
2. Open GitHub repository **Settings > Pages**.
3. Select **Build and deployment > Source: GitHub Actions**.
4. Open **Actions**, find **Deploy RankNova frontend to GitHub Pages**, and run it if necessary.
5. Visit https://mmoavia7861.github.io/RankNova/ after a successful deploy.

The workflow builds Vite with `GITHUB_PAGES=true`, applying `base: '/RankNova/'`, copies `index.html` to `404.html` as a client-side route fallback, and deploys the built `dist/` folder. On GitHub Pages, direct requests for nested routes may still return an HTTP 404 status to crawlers even though the browser displays the React app. For reliable SEO indexing, use a full-stack host that returns HTTP 200 with appropriate HTML for each route.

## For a fully working business website

Use Google AI Studio **Import from GitHub** and select `mmoavia7861/RankNova` to continue editing the existing project.

Deploy the **full-stack Express application**, including `server.ts`, to Cloud Run or a host capable of running Node services. Configure the real server-side environment variables and Firebase settings there. GitHub Pages cannot act as a substitute for that server.

For Firebase Google Sign-In on the preview, add `mmoavia7861.github.io` to authorized domains in Firebase Authentication, provided that domain belongs to the deployed site. Ensure Firestore rules are deployed and verify owner-only access on the backend and in Firestore rather than relying on UI checks.

Before applying for AdSense, test all three tools end-to-end on the final hosted domain and ensure legal pages, content, consent, authentication, and ads settings accurately match deployed behavior. AdSense approval is not guaranteed.
