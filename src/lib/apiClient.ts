/**
 * Production API endpoint for static GitHub Pages builds.
 * VITE_API_BASE_URL is a public HTTPS URL (NOT a secret).
 * It can be a normal API origin or the exact Firebase HTTPS Function URL
 * ending in /ranknovaApi returned by Firebase CLI, e.g.
 * https://asia-south1-PROJECT.cloudfunctions.net/ranknovaApi
 * We never accept arbitrary paths, queries or credentials.
 * Full-stack builds can use same-origin API calls when no override is set.
 */
const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();

function normalizeApiBase(raw: string): string {
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const localDevelopment = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localDevelopment) return '';
    if (url.username || url.password || url.search || url.hash) return '';
    if (url.pathname === '/') return url.origin;
    // Firebase HTTPS Functions include the function name in the service URL.
    // The browser appends /api/health and /api/audit to this prefix.
    const isFirebaseFunction = url.hostname.endsWith('.cloudfunctions.net') &&
      url.pathname === '/ranknovaApi';
    return isFirebaseFunction ? url.origin + url.pathname : '';
  } catch {
    return '';
  }
}

export const API_BASE_URL = normalizeApiBase(configured);
export const IS_GITHUB_PAGES = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');

// A static site never assumes its /api/* routes are present.
export const IS_STATIC_SITE = import.meta.env.VITE_STATIC_SITE === 'true' || IS_GITHUB_PAGES;
export const API_CONFIGURED = !IS_STATIC_SITE || Boolean(API_BASE_URL);

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
