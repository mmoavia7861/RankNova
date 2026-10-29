/**
 * Privacy-conscious Google Analytics 4 event helper
 * Avoids sending personal query strings or sensitive data.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function sanitizeUrlForAnalytics(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.hostname; // Only domain, no paths or query params
  } catch {
    return 'unknown_domain';
  }
}

export function trackEvent(
  eventName:
    | 'tool_view'
    | 'audit_started'
    | 'audit_completed'
    | 'audit_failed'
    | 'meta_copied'
    | 'schema_copied'
    | 'report_downloaded',
  params: Record<string, any> = {}
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString()
    });
  } else {
    // In dev, silently log for developer transparency
    console.debug(`[Analytics Event] ${eventName}:`, params);
  }
}
