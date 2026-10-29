/**
 * SSRF and URL validation security guard
 */

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

export function validateTargetUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Target URL is required.' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length of 2048 characters.' };
  }

  // Only prepend protocol if no protocol scheme is specified at all
  let urlString = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'Malformed or invalid URL format.' };
  }

  // Only http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted.' };
  }

  // Reject embedded credentials (http://user:pass@host)
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URLs with embedded credentials are not allowed.' };
  }

  // Reject empty or invalid hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname.includes(' ') || hostname.length > 255) {
    return { valid: false, error: 'Invalid hostname provided.' };
  }

  // Reject obvious localhost / internal hostnames
  const forbiddenHosts = [
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'metadata.google.internal',
    'instance-data',
    '169.254.169.254'
  ];

  if (forbiddenHosts.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, error: 'Requests to internal, localhost, or cloud metadata domains are strictly forbidden.' };
  }

  // Reject non-standard ports (allowed: 80, 443, or unspecified)
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { valid: false, error: 'Custom ports are not permitted. Only ports 80 and 443 are allowed.' };
  }

  return { valid: true, url: parsed };
}
