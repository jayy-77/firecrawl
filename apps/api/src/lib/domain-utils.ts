import { checkUrl } from "./validateUrl";

export type WildcardPolicy = "none" | "subdomains_only";

export function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`;
  }

  try {
    checkUrl(candidate);
    const url = new URL(candidate);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower.startsWith("127.") ||
    lower.startsWith("10.") ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/i.test(lower) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/i.test(lower)
  ) {
    return true;
  }
  return false;
}

export function extractHostname(url: string): string | null {
  try {
    const value = url.trim();
    const candidate = /^https?:\/\//i.test(value) ? value : `http://${value}`;
    const parsed = new URL(candidate);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function matchesWildcard(hostname: string, pattern: string): boolean {
  if (!pattern.startsWith("*.")) return false;
  const suffix = pattern.slice(1); // keep leading dot
  return hostname.endsWith(suffix) && hostname !== pattern.slice(2);
}

export function domainMatches(
  hostname: string,
  domainPattern: string,
  wildcardPolicy: WildcardPolicy,
): boolean {
  const normalizedHost = hostname.toLowerCase();
  const normalizedPattern = domainPattern.toLowerCase();

  if (normalizedPattern.startsWith("*.")) {
    if (wildcardPolicy !== "subdomains_only") {
      return false;
    }
    return matchesWildcard(normalizedHost, normalizedPattern);
  }

  return normalizedHost === normalizedPattern;
}

export interface DomainFilters {
  allowlist: string[];
  denylist: string[];
  wildcardPolicy: WildcardPolicy;
}

export function shouldIncludeHostname(
  hostname: string,
  filters: DomainFilters,
): boolean {
  if (isPrivateHostname(hostname)) {
    return false;
  }

  const { allowlist, denylist, wildcardPolicy } = filters;

  const isDenied = denylist.some(pattern =>
    domainMatches(hostname, pattern, wildcardPolicy),
  );
  if (isDenied) return false;

  if (allowlist.length === 0) {
    return true;
  }

  return allowlist.some(pattern =>
    domainMatches(hostname, pattern, wildcardPolicy),
  );
}

