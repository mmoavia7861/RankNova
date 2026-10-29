import dns from 'node:dns/promises';
import net from 'node:net';

export interface IpValidationResult {
  valid: boolean;
  error?: string;
  ip?: string;
}

/**
 * Checks if an IPv4 address is in a private, loopback, link-local, or cloud metadata range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(p => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) {
    return true; // Malformed is unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private 172.16 - 172.31)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 100.64.0.0/10 (Shared / Carrier-Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is private, loopback, link-local, or IPv4-mapped private.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 loopback or :: unspecified
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
  }

  // fc00::/7 (Unique local address)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // fe80::/10 (Link-local)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Multicast ff00::/8
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Resolves hostname and validates all returned IP addresses against SSRF attack vectors.
 */
export async function validateHostIp(hostname: string): Promise<IpValidationResult> {
  // If hostname is directly an IP literal
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: 'Target IP belongs to a private, loopback, or metadata network.' };
    }
    return { valid: true, ip: hostname };
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      return { valid: false, error: 'Target IPv6 belongs to a private or loopback network.' };
    }
    return { valid: true, ip: hostname };
  }

  try {
    // Resolve both IPv4 and IPv6 records
    const lookupResults = await dns.lookup(hostname, { all: true });

    if (!lookupResults || lookupResults.length === 0) {
      return { valid: false, error: 'Domain resolution returned no IP records.' };
    }

    for (const record of lookupResults) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return {
          valid: false,
          error: `Domain resolved to private or restricted IPv4 address (${record.address}). Request blocked.`
        };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return {
          valid: false,
          error: `Domain resolved to private or restricted IPv6 address (${record.address}). Request blocked.`
        };
      }
    }

    return { valid: true, ip: lookupResults[0].address };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `DNS resolution failed: ${msg}` };
  }
}
