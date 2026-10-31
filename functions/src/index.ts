import { onRequest } from 'firebase-functions/v2/https';
import { runSeoAudit } from '../../src/server/auditFetcher';
import { validateTargetUrl } from '../../src/server/security/urlGuard';

type AuditRequest = { url?: unknown };

const staticAllowedOrigins = new Set([
  'https://mmoavia7861.github.io'
]);

// Add actual production origins after deployment via Firebase environment settings.
// Never allow arbitrary Origin values for public website audit endpoints.
function allowedOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true; // curl, uptime monitoring, server-side requests
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && parsed.hostname === 'localhost')) {
      return false;
    }
    const configured = (process.env.RANKNOVA_ALLOWED_ORIGINS || '').split(',').map(v => v.trim());
    // Only the RankNova project's exact Firebase Hosting origins, never all web.app sites.
    const ownHosting = ['gen-lang-client-0081440357.web.app', 'gen-lang-client-0081440357.firebaseapp.com'].includes(parsed.host);
    return staticAllowedOrigins.has(origin) || configured.includes(origin) || ownHosting;
  } catch {
    return false;
  }
}

function cors(req: any, res: any): boolean {
  const origin = req.headers.origin as string | undefined;
  if (!allowedOrigin(origin, req.headers.host as string | undefined)) {
    res.status(403).json({ error: 'Origin is not allowed.' });
    return false;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}

// Single instance limiter is a cost-safety baseline, not a global anti-abuse system.
// maxInstances limits exposure, but production abuse controls are still required.
const windowMs = 60_000;
const requestTimes = new Map<string, number[]>();
function allowRequest(ip: string): boolean {
  const now = Date.now();
  const active = (requestTimes.get(ip) || []).filter(t => now - t < windowMs);
  if (active.length >= 10) return false;
  active.push(now);
  requestTimes.set(ip, active);
  if (requestTimes.size > 3000) {
    for (const [key, times] of requestTimes) {
      if (times.every(t => now - t > windowMs)) requestTimes.delete(key);
    }
  }
  return true;
}

export const ranknovaApi = onRequest({
  region: 'asia-south1',
  memory: '512MiB',
  cpu: 1,
  timeoutSeconds: 30,
  minInstances: 0,
  maxInstances: 2,
  concurrency: 10,
  cors: false
}, async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (!cors(req, res)) return;

  // Hosting rewrites pass /api/...; Firebase's direct HTTPS URL is
  // /ranknovaApi/api/... from outside. Normalize both forms defensively.
  const rawPath = new URL(req.url || '/', 'https://firebase.invalid').pathname;
  const path = rawPath.startsWith('/ranknovaApi/api/')
    ? rawPath.slice('/ranknovaApi'.length)
    : rawPath;
  if (path === '/api/health' && req.method === 'GET') {
    res.status(200).json({ status: 'ok', service: 'ranknova-firebase-audit', backend: 'firebase-functions' });
    return;
  }
  if (path === '/api/search-grounding') {
    res.status(503).json({ error: 'Optional live search analysis is not configured on Firebase Functions.' });
    return;
  }
  if (path !== '/api/audit') {
    res.status(404).json({ error: 'Unknown API endpoint.' });
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!allowRequest(ip)) {
    res.status(429).json({ error: 'Rate limit reached. Please retry after a minute.' });
    return;
  }
  const requestBody: AuditRequest = req.body || {};
  const raw = requestBody.url;
  if (typeof raw !== 'string' || !raw.trim() || raw.length > 2048) {
    res.status(400).json({ error: 'Enter a valid public website URL (maximum 2048 characters).' });
    return;
  }
  const validation = validateTargetUrl(raw);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error || 'This URL cannot be audited.' });
    return;
  }
  try {
    const report = await runSeoAudit(raw);
    res.status(200).json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete website audit.';
    // Do not log complete user-supplied URLs, tokens, query strings or page content.
    console.warn('SEO audit failed:', message.slice(0, 200));
    res.status(400).json({ error: message });
  }
});
