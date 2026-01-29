/**
 * URL sanitization helpers used across crawl/scrape flows.
 *
 * We explicitly strip credentials/userinfo (`https://user:pass@host/...`) because:
 * - Modern browsers strip it and it is almost always accidental/misconfigured.
 * - It breaks URL de-duplication, causing duplicate crawling.
 * - It can accidentally leak credentials into logs/metrics and HTTP requests.
 */

/**
 * Strip `username:password@` (userinfo) from an absolute HTTP(S) URL.
 *
 * If the URL is not parseable or isn't HTTP(S), returns the input unchanged.
 */
export function stripUrlUserInfo(url: string): string {
  try {
    const u = new URL(url);

    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return url;
    }

    if (!u.username && !u.password) {
      return url;
    }

    // Clear password first to avoid transient `:pass@host` serialization.
    u.password = "";
    u.username = "";

    return u.href;
  } catch {
    return url;
  }
}

/**
 * Strip `userinfo@` from the authority part of a URL string that does NOT include
 * a scheme, e.g. `user:pass@www.example.com/path?x#y`.
 *
 * This is intended for "canonicalization" helpers that first strip `http(s)://`.
 */
export function stripAuthorityUserInfo(urlWithoutProtocol: string): string {
  const authorityEnd = urlWithoutProtocol.search(/[/?#]/);
  const authority =
    authorityEnd === -1
      ? urlWithoutProtocol
      : urlWithoutProtocol.slice(0, authorityEnd);
  const rest =
    authorityEnd === -1 ? "" : urlWithoutProtocol.slice(authorityEnd);

  const at = authority.lastIndexOf("@");
  if (at === -1) {
    return urlWithoutProtocol;
  }

  const hostPort = authority.slice(at + 1);
  return hostPort + rest;
}

