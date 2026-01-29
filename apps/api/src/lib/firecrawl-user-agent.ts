import { config } from "../config";

/**
 * Firecrawl user-agent helpers.
 *
 * Motivation:
 * - Make Firecrawl identifiable at the HTTP layer so sites can block it via UA.
 * - Keep robots.txt checks aligned with an identifiable Firecrawl UA token.
 *
 * Note: We intentionally apply this at request time (engines / download utils),
 * not by mutating `ScrapeOptions.headers`, because other control-plane logic
 * treats "any headers present" as a signal (e.g. cache/index eligibility).
 */

export const FIRECRAWL_USER_AGENT_TOKEN = "Firecrawl";

// Default UA is explicit (not trying to impersonate a browser) but still includes
// the token sites can match on.
const DEFAULT_FIRECRAWL_USER_AGENT = "FirecrawlAgent (+https://firecrawl.dev)";

export function getFirecrawlUserAgent(): string {
  const configured = config.FIRECRAWL_USER_AGENT?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_FIRECRAWL_USER_AGENT;
}

function ensureToken(ua: string): string {
  const trimmed = ua.trim();
  if (trimmed.length === 0) return getFirecrawlUserAgent();
  if (trimmed.toLowerCase().includes(FIRECRAWL_USER_AGENT_TOKEN.toLowerCase())) {
    return trimmed;
  }
  return `${trimmed} ${FIRECRAWL_USER_AGENT_TOKEN}`;
}

function headersToRecord(
  headers: Headers | [string, string][] | Record<string, string> | undefined,
): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

/**
 * Returns a new headers object with a Firecrawl-identifiable User-Agent set.
 *
 * - If no user-agent header exists, sets it to `getFirecrawlUserAgent()`.
 * - If one exists but doesn't include `FIRECRAWL_USER_AGENT_TOKEN`, appends it.
 */
export function withFirecrawlUserAgent(
  headers:
    | Headers
    | [string, string][]
    | Record<string, string>
    | undefined,
): Record<string, string> {
  const out = headersToRecord(headers);

  const existingKey = Object.keys(out).find(
    k => k.toLowerCase() === "user-agent",
  );

  if (existingKey) {
    out[existingKey] = ensureToken(out[existingKey] ?? "");
    return out;
  }

  out["User-Agent"] = ensureToken(getFirecrawlUserAgent());
  return out;
}

