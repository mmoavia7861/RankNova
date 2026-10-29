/**
 * Production API endpoint for static GitHub Pages builds.
 * VITE_API_BASE_URL is a public ORIGIN (not a secret), e.g. https://ranknova-api-xyz.run.app
 * Cloud Run full-stack pages use same-origin API calls when no override is set.
 */
const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();

function normalizeApiBase(raw: string): string {
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const localDevelopment = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localDevelopment) return '';
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return '';
    return url.origin;
  } catch {
    return '';
  }
}

export const API_BASE_URL = normalizeApiBase(configured);
export const IS_GITHUB_PAGES = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');

// A static site never assumes its /api/* routes are present.
export const API_CONFIGURED = !IS_GITHUB_PAGES || Boolean(API_BASE_URL);

export function apiEndpoint(path: '/api/health' | '/api/audit' | '/api/search-grounding'): string {
  return `${API_BASE_URL}${path}`;
}

export async function checkApiHealth(): Promise<boolean> {
  if (!API_CONFIGURED) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(apiEndpoint('/api/health'), { signal: controller.signal, cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return false;
    const result = await response.json();
    return result?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
