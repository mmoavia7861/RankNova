# RankNova SEO / GEO / AEO launch checklist

This is an implementation and verification checklist, not a claim that search engines or AI assistants will recommend RankNova.

## Scope and honest positioning
Promote only the three currently documented tools: Website SEO Checker, Meta Tag Generator, and Schema JSON-LD Generator. Do not target PDF or QR-code generator queries until those tools actually exist and pass functional tests. Never fabricate search volume, reviews, ratings, benchmarks, or AI citations.

## Production canonical host
Choose **one** production origin after domain purchase. Set `APP_URL` to its exact HTTPS origin (without trailing slash) on the Express host. Make all sitemap URLs, canonical tags, Open Graph URLs and internal links use that origin. Redirect other origins where supported; avoid indexing duplicate GitHub Pages and custom-domain copies. Do not ship a guessed canonical domain.

## Crawling and rendering
- Verify GET /, /tools/seo-audit, /tools/meta-tag-generator, /tools/schema-generator, /guides, /about, /contact, /privacy-policy and /terms return 200 and useful readable HTML.
- Verify /robots.txt and /sitemap.xml on the **actual** production origin. The Express routes do not automatically exist on a static-only GitHub Pages build.
- Ensure each tool's main explanatory text, usage steps, limitations and unique title/description are in the initial server response or reliably prerendered; do not rely on client-side JavaScript for all meaningful content.
- Check that robots rules do not block public tool pages or search crawlers such as OAI-SearchBot. Allowing a crawler is not a recommendation guarantee.
- Check that the OG image is a valid, crawlable absolute HTTPS URL on the production host.
- Request indexing through Google Search Console and submit the actual production sitemap. Monitor Bing Webmaster Tools separately.

## Tool-page content
For each of the three tools publish original, verifiable:
1. A plain-language answer to what the tool does and who needs it.
2. Step-by-step instructions and a realistic worked example.
3. What input is processed, what is stored, and known limitations.
4. A short FAQ addressing user questions without keyword stuffing.
5. Relevant links to the other two tools and a clear contact path.

SEO Checker must state that its score is RankNova's own diagnostic score, **not** Google's ranking score, and that JavaScript-rendered page content may not be evaluated. Schema Generator must not promise rich-result eligibility or search ranking improvements.

## Structured data
Use JSON-LD only where it describes visible, truthful page content. WebSite / Organization information may be appropriate after official brand URLs and contact details are verified. SoftwareApplication markup should accurately describe each tool; do not invent review, aggregateRating, price, or offers. Validate with Schema Markup Validator; Google Rich Results Test only tests Google-supported rich result types.

## Performance and accessibility
Test on mobile with PageSpeed Insights and Chrome DevTools. Audit the JS bundle, lazy-load noncritical UI, preload only essential resources, avoid blank screens, provide accessible loading/error states, and test API timeouts. Record real LCP, INP, CLS rather than claiming an unmeasured score.

## AdSense and privacy
Before applying: test every tool end-to-end, ensure original substantial content, visible privacy/contact/about/terms pages, accurate cookie/analytics disclosure, consent management where required, and no deceptive ad placement. AdSense approval and revenue are not guaranteed.

## Release verification
Run `npm run lint`, `npm test`, `npm run build`, then smoke-test production routes, sitemap, API health and one safe public-domain audit URL. Do not merge until the deployment origin and API base URL are confirmed.
