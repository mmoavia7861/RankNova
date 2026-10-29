import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { runSeoAudit } from './src/server/auditFetcher';
import { getGroundedSerpInsights } from './src/server/geminiSearch';
import { checkRateLimit } from './src/server/security/rateLimit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

const app = express();
// Enable a single trusted reverse-proxy hop only when deployed behind Cloud Run.
if (process.env.TRUST_PROXY_HOPS === '1') app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// CORS is needed ONLY when the GitHub Pages frontend calls a separate Cloud Run API.
// Configure allowed public site origins on the server. Never use '*' for public audit APIs.
const allowedOrigins = new Set((process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',').map(value => value.trim()).filter(Boolean));

app.use('/api', (req, res, next) => {
  const origin = req.get('Origin');
  if (!origin) return next(); // e.g. curl, health monitors or server-to-server requests
  let sameOrigin = false;
  try {
    const parsed = new URL(origin);
    sameOrigin = parsed.host === req.get('host') && (parsed.protocol === 'https:' || (!isProduction && parsed.protocol === 'http:'));
  } catch {
    return res.status(403).json({ error: 'Invalid request origin.' });
  }

  if (!sameOrigin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }

  res.vary('Origin');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${APP_URL}/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// Dynamic sitemap.xml
app.get(['/sitemap.xml', '/api/sitemap.xml'], (req, res) => {
  const routes = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/tools/seo-audit', priority: '0.9', changefreq: 'weekly' },
    { loc: '/tools/meta-tag-generator', priority: '0.9', changefreq: 'weekly' },
    { loc: '/tools/schema-generator', priority: '0.9', changefreq: 'weekly' },
    { loc: '/guides', priority: '0.8', changefreq: 'weekly' },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
    { loc: '/disclaimer', priority: '0.3', changefreq: 'yearly' }
  ];

  const now = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    r => `  <url>
    <loc>${APP_URL}${r.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// SEO Audit API Endpoint (Protected with Rate Limiter & SSRF Guards)
app.post('/api/audit', async (req, res) => {
  const clientIp = req.ip || 'unknown';
  const rateLimit = checkRateLimit(clientIp, 15, 60000); // 15 audits/min per IP

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before running another audit.`
    });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Target URL is required.' });
  }

  try {
    const report = await runSeoAudit(url);
    return res.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to audit website.';
    console.error(`Audit error for ${url}:`, message);
    return res.status(400).json({ error: message });
  }
});

// Gemini Search Grounding API Endpoint
app.post('/api/search-grounding', async (req, res) => {
  const clientIp = req.ip || 'unknown';
  const rateLimit = checkRateLimit(`gemini_${clientIp}`, 10, 60000);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before requesting search data.`
    });
  }

  const { keyword, topic, brand } = req.body;
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Target keyword is required.' });
  }

  try {
    const insights = await getGroundedSerpInsights(keyword, topic || keyword, brand);
    if (!insights) return res.status(503).json({ error: 'Search analysis has not been configured or is unavailable.' });
    return res.json({ insights });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Search grounding temporarily unavailable.' });
  }
});

// Unknown API routes should return JSON 404, not HTML from the React SPA.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Route-specific HTML metadata for prerendering / crawler discovery
const ROUTE_METADATA: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'RankNova - Professional SEO Tools & Website Growth Analytics',
    description: 'Diagnose on-page SEO issues, generate CTR-boosting meta tags with live Google SERP preview, and build valid Schema.org JSON-LD markup.'
  },
  '/tools/seo-audit': {
    title: 'Website SEO Audit Checker | RankNova',
    description: 'Run deep technical on-page audits: verify title tags, meta descriptions, canonicals, robots directives, H1-H3 hierarchy, image alt text, and Open Graph.'
  },
  '/tools/meta-tag-generator': {
    title: 'Meta Tag Generator & SERP Preview Simulator | RankNova',
    description: 'Create high-converting title tags and meta descriptions with live desktop & mobile Google search snippet previews and search grounding insights.'
  },
  '/tools/schema-generator': {
    title: 'Schema JSON-LD Markup Generator | RankNova',
    description: 'Generate valid Schema.org JSON-LD structured data for Articles, Products, Local Businesses, and Breadcrumb trails for Google rich results.'
  },
  '/guides': {
    title: 'Actionable SEO Guides & Technical Documentation | RankNova',
    description: 'Learn technical SEO best practices: title length limits, meta descriptions, Schema.org implementation, and Core Web Vitals optimization.'
  },
  '/about': {
    title: 'About RankNova - Transparent SEO Utilities',
    description: 'Discover the mission and architecture behind RankNova: fast, free, transparent SEO utilities with no hidden data sales.'
  },
  '/contact': {
    title: 'Contact Support & Inquiries | RankNova',
    description: 'Submit technical inquiries, feedback, or custom SEO consultation requests.'
  },
  '/privacy-policy': {
    title: 'Privacy Policy | RankNova',
    description: 'Read how RankNova handles user data, Google Workspace permissions, analytics cookies, and consent management.'
  },
  '/terms': {
    title: 'Terms of Service | RankNova',
    description: 'Read the terms and conditions for using RankNova public SEO audit and generator tools.'
  },
  '/disclaimer': {
    title: 'Tool Disclaimer & Limitation of Liability | RankNova',
    description: 'Understand scoring methodology: RankNova scores are proprietary rule-based diagnostics and not official Google search grades.'
  }
};

function injectMetadata(html: string, reqPath: string): string {
  const meta = ROUTE_METADATA[reqPath] || ROUTE_METADATA['/'];
  return html
    .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
    .replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${meta.description}" />`
    )
    .replace(
      /<meta property="og:title" content=".*?" \/>/,
      `<meta property="og:title" content="${meta.title}" />`
    )
    .replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${meta.description}" />`
    );
}

// Dev vs Prod Vite handling
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const finalHtml = injectMetadata(template, req.path);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { index: false }));

    app.use('*', (req, res) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = injectMetadata(template, req.path);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RankNova SEO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
