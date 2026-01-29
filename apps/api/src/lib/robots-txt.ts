import { config } from "../config";
import { Logger } from "winston";
import { ScrapeOptions, scrapeOptions } from "../controllers/v2/types";
import { scrapeURL } from "../scraper/scrapeURL";
import { Engine } from "../scraper/scrapeURL/engines";
import { CostTracking } from "./cost-tracking";
import { useIndex } from "../services";

const ROBOTS_MAX_AGE = 1 * 24 * 60 * 60 * 1000;

const useFireEngine =
  config.FIRE_ENGINE_BETA_URL !== "" &&
  config.FIRE_ENGINE_BETA_URL !== undefined;

export { createRobotsChecker, isUrlAllowedByRobots } from "./robots-policy";
export type { RobotsTxtChecker } from "./robots-policy";

export async function fetchRobotsTxt(
  {
    url,
    zeroDataRetention,
    location,
  }: {
    url: string;
    zeroDataRetention: boolean;
    location?: ScrapeOptions["location"];
  },
  scrapeId: string,
  logger: Logger,
  abort?: AbortSignal,
): Promise<{ content: string; url: string }> {
  const urlObj = new URL(url);
  const robotsTxtUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

  const shouldPrioritizeFireEngine = location && useFireEngine;

  const forceEngine: Engine[] = [
    ...(useIndex ? ["index" as const] : []),
    ...(shouldPrioritizeFireEngine
      ? [
          "fire-engine;tlsclient" as const,
          "fire-engine;tlsclient;stealth" as const,
          // final fallback to chrome-cdp to fill the index
          "fire-engine;chrome-cdp" as const,
          "fire-engine;chrome-cdp;stealth" as const,
        ]
      : []),
    "fetch",
    ...(!shouldPrioritizeFireEngine && useFireEngine
      ? [
          "fire-engine;tlsclient" as const,
          "fire-engine;tlsclient;stealth" as const,
          // final fallback to chrome-cdp to fill the index
          "fire-engine;chrome-cdp" as const,
          "fire-engine;chrome-cdp;stealth" as const,
        ]
      : []),
  ];

  let content: string = "";
  const response = await scrapeURL(
    "robots-txt;" + scrapeId,
    robotsTxtUrl,
    scrapeOptions.parse({
      formats: ["rawHtml"],
      timeout: 8000,
      maxAge: ROBOTS_MAX_AGE,
      ...(location ? { location } : {}),
    }),
    {
      forceEngine,
      v0DisableJsDom: true,
      externalAbort: abort
        ? {
            signal: abort,
            tier: "external",
            throwable() {
              return new Error("Robots.txt fetch aborted");
            },
          }
        : undefined,
      teamId: "robots-txt",
      zeroDataRetention,
    },
    new CostTracking(),
  );

  if (
    response.success &&
    response.document.metadata.statusCode >= 200 &&
    response.document.metadata.statusCode < 300
  ) {
    content = response.document.rawHtml!;
  } else {
    if (response.success && response.document.metadata.statusCode === 404) {
      logger.warn("Robots.txt not found", { robotsTxtUrl }); // should probably index 404 robots.txt
      return { content: "", url: robotsTxtUrl };
    }

    logger.error(`Request failed for robots.txt fetch`, {
      method: "fetchRobotsTxt",
      robotsTxtUrl,
      error: response.success
        ? response.document.metadata.statusCode
        : response.error,
    });
    return { content: "", url: robotsTxtUrl };
  }

  // return URL in case we've been redirected
  return {
    content: content,
    url: response.document.metadata.url || robotsTxtUrl,
  };
}

// `createRobotsChecker` and `isUrlAllowedByRobots` intentionally live in
// `robots-policy.ts` so the pure robots logic can be tested without needing to
// import the entire scrapeURL pipeline (which pulls in native deps).
