export type HeaderMap = Record<string, string>;

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * Playwright does not allow overriding `user-agent` via `page.setExtraHTTPHeaders()`.
 * It must be set on the BrowserContext via the `userAgent` option.
 *
 * This helper extracts a requested user agent (from either an explicit field or headers)
 * and returns sanitized headers with any `user-agent` key removed.
 */
export function extractUserAgentAndSanitizeHeaders(
  headers: unknown,
  explicitUserAgent?: unknown,
): { userAgent?: string; headers?: HeaderMap } {
  let userAgent = isNonEmptyString(explicitUserAgent)
    ? explicitUserAgent.trim()
    : undefined;

  if (!headers || typeof headers !== "object") {
    return { userAgent };
  }

  const out: HeaderMap = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    if (key.toLowerCase() === "user-agent") {
      if (!userAgent && value.trim()) {
        userAgent = value.trim();
      }
      continue;
    }
    out[key] = value;
  }

  return {
    userAgent,
    headers: Object.keys(out).length > 0 ? out : undefined,
  };
}

