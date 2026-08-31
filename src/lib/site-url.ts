function isPrivateHost(host: string): boolean {
  return /^(0\.0\.0\.0|127\.0\.0\.1|\[::\]|localhost)(:|$)/i.test(host.trim());
}

/**
 * Public site origin for redirects. Never use 0.0.0.0 / container PORT —
 * Safari blocks those (WebKitErrorDomain 103).
 */
export function publicSiteOrigin(request: Request): string {
  const configured = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "")
  )
    .trim()
    .replace(/\/$/, "");
  if (configured) {
    try {
      const parsed = new URL(configured.includes("://") ? configured : `https://${configured}`);
      if (!isPrivateHost(parsed.host)) {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      /* fall through */
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || "";
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost && !isPrivateHost(forwardedHost)) {
    return `${proto}://${forwardedHost}`;
  }

  const headerHost = request.headers.get("host") || "";
  if (headerHost && !isPrivateHost(headerHost)) {
    return `${proto}://${headerHost}`;
  }

  return "https://marketbiqs-frontend-production.up.railway.app";
}
