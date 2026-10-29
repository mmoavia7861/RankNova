# RankNova Security Architecture & Threat Model

## 1. Threat Model: Server-Side Request Forgery (SSRF) Defense

Because the **Website SEO Audit Checker** accepts arbitrary user-supplied URLs to diagnose on-page HTML, the outbound fetch pipeline is the highest-risk component of the application. An unconstrained server proxy could be leveraged by attackers to:
- Access internal GCP cloud metadata (`http://169.254.169.254/computeMetadata/v1/`)
- Scan internal virtual private cloud (VPC) subnets or loopback microservices (`127.0.0.1`, `localhost`)
- Probe private database endpoints or internal container orchestrators
- Cause resource exhaustion through unbounded payloads or redirect loops

### Multi-Layer Defense in Depth
1. **Scheme & Credential Enforcement (`urlGuard.ts`)**:
   - Only `http:` and `https:` protocols are accepted.
   - Embedded credentials (`user:pass@host`) are rejected immediately.
   - Hostname strings are restricted to 255 characters and sanitized against character encoding bypasses.
2. **DNS Resolution & IP Deny-Listing (`ipGuard.ts`)**:
   - Before any socket connection is created, `dns.promises.lookup` resolves all IPv4 (A) and IPv6 (AAAA) records.
   - All addresses are evaluated against RFC1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), link-local / cloud metadata (`169.254.0.0/16`, `fe80::/10`), carrier-grade NAT (`100.64.0.0/10`), unique local IPv6 (`fc00::/7`), and IPv4-mapped IPv6 ranges.
3. **Per-Redirect Validation**:
   - Redirects are not followed blindly.
   - Standard fetch automatic redirect following is disabled (`redirect: 'manual'`).
   - Every `Location` header destination is run through the entire URL and IP guard pipeline.
   - Maximum redirect depth is capped at 3 hops.
4. **Denial-of-Wallet & Resource Caps**:
   - Outbound fetch timeout: strictly 10 seconds via `AbortController`.
   - Maximum response body: streamed and capped at 3MB.
   - Target JavaScript execution: disabled. HTML is parsed statically via `node-html-parser`.

## 2. Authentication & Google Workspace Token Security

1. **In-Memory Token Cache**:
   - OAuth 2.0 access tokens obtained via `signInWithPopup` are cached strictly in volatile memory.
   - Tokens are **never stored** in `localStorage`, `sessionStorage`, or server cookies.
   - Tokens are synchronously wiped upon sign-out via `onAuthStateChanged`.
2. **User Confirmation for Destructive Actions**:
   - Workspace operations (such as sending an email via Gmail API or creating forms) present explicit confirmation modals requiring affirmative user consent before dispatch.
3. **Role-Based Access Control (RBAC)**:
   - Admin access is gated at `moaviah760@gmail.com` and checked with `request.auth.token.email_verified == true`.
   - Firestore security rules deny client writes to system collections without verified admin identity.
