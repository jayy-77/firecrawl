import robotsParser, { Robot } from "robots-parser";

export interface RobotsTxtChecker {
  robotsTxtUrl: string;
  robotsTxt: string;
  robots: Robot;
}

export function createRobotsChecker(
  url: string,
  robotsTxt: string,
): RobotsTxtChecker {
  const urlObj = new URL(url);
  const robotsTxtUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
  const robots = robotsParser(robotsTxtUrl, robotsTxt);
  return {
    robotsTxtUrl,
    robotsTxt,
    robots,
  };
}

/**
 * Checks whether a URL is allowed by robots.txt for Firecrawl.
 *
 * Default behavior:
 * - Prefer matching an explicit Firecrawl user-agent group if present
 *   (User-agent: Firecrawl / FirecrawlAgent / FireCrawlAgent).
 * - Otherwise fall back to `*` (handled inside robots-parser).
 */
export function isUrlAllowedByRobots(
  url: string,
  robots: Robot | null,
  userAgents: string[] = ["Firecrawl", "FireCrawlAgent", "FirecrawlAgent"],
): boolean {
  if (!robots) return true;

  for (const userAgent of userAgents) {
    let isAllowed = robots.isAllowed(url, userAgent);

    // Handle null/undefined responses - default to true (allowed)
    if (isAllowed === null || isAllowed === undefined) {
      isAllowed = true;
    }

    if (isAllowed == null) {
      isAllowed = true;
    }

    // Also check with trailing slash if URL doesn't have one
    // This catches cases like "Disallow: /path/" when user requests "/path"
    if (isAllowed && !url.endsWith("/")) {
      const urlWithSlash = url + "/";
      let isAllowedWithSlash = robots.isAllowed(urlWithSlash, userAgent);

      if (isAllowedWithSlash == null) {
        isAllowedWithSlash = true;
      }

      // If the trailing slash version is explicitly disallowed, block it
      if (isAllowedWithSlash === false) {
        isAllowed = false;
      }
    }

    // If ANY of our Firecrawl UA identifiers is explicitly disallowed, we treat
    // it as blocked. This is intentionally conservative to allow site owners to
    // block Firecrawl via different common UA tokens.
    if (isAllowed === false) {
      return false;
    }
  }

  return true;
}

