import type { Logger } from "winston";
import { search } from "./v2";
import { SearchV2Response } from "../lib/entities";
import {
  buildSearchQuery,
  getCategoryFromUrl,
  CategoryOption,
} from "../lib/search-query-builder";
import { ScrapeOptions, TeamFlags } from "../controllers/v2/types";
import {
  getItemsToScrape,
  scrapeSearchResults,
  mergeScrapedContent,
  calculateScrapeCredits,
} from "./scrape";
import {
  DomainOverrides,
  EnforcementSummary,
  enforceSearchProfile,
} from "../services/search-profiles";

interface SearchOptions {
  query: string;
  limit: number;
  tbs?: string;
  filter?: string;
  lang?: string;
  country?: string;
  location?: string;
  sources: Array<{ type: string }>;
  categories?: CategoryOption[];
  enterprise?: ("default" | "anon" | "zdr")[];
  scrapeOptions?: ScrapeOptions;
  timeout: number;
  profileId?: string;
  overrides?: DomainOverrides;
}

interface SearchContext {
  teamId: string;
  origin: string;
  apiKeyId: number | null;
  flags: TeamFlags;
  requestId: string;
  bypassBilling?: boolean;
  zeroDataRetention?: boolean;
}

interface SearchExecuteResult {
  response: SearchV2Response;
  totalResultsCount: number;
  searchCredits: number;
  scrapeCredits: number;
  totalCredits: number;
  shouldScrape: boolean;
  enforcementSummary: EnforcementSummary | null;
}

export async function executeSearch(
  options: SearchOptions,
  context: SearchContext,
  logger: Logger,
): Promise<SearchExecuteResult> {
  const { query, limit, sources, categories, scrapeOptions } = options;
  const {
    teamId,
    origin,
    apiKeyId,
    flags,
    requestId,
    bypassBilling,
    zeroDataRetention,
  } = context;

  const num_results_buffer = Math.floor(limit * 2);

  logger.info("Searching for results");

  const searchTypes = [...new Set(sources.map((s: any) => s.type))];
  const { query: searchQuery, categoryMap } = buildSearchQuery(
    query,
    categories,
  );

  const searchResponse = (await search({
    query: searchQuery,
    logger,
    advanced: false,
    num_results: num_results_buffer,
    tbs: options.tbs,
    filter: options.filter,
    lang: options.lang,
    country: options.country,
    location: options.location,
    type: searchTypes,
    enterprise: options.enterprise,
  })) as SearchV2Response;

  const { response: filteredResponse, summary } = enforceSearchProfile(
    searchResponse,
    options.profileId,
    options.overrides,
  );

  if (filteredResponse.web && filteredResponse.web.length > 0) {
    filteredResponse.web = filteredResponse.web.map(result => ({
      ...result,
      category: getCategoryFromUrl(result.url, categoryMap),
    }));
  }

  if (filteredResponse.news && filteredResponse.news.length > 0) {
    filteredResponse.news = filteredResponse.news.map(result => ({
      ...result,
      category: result.url
        ? getCategoryFromUrl(result.url, categoryMap)
        : undefined,
    }));
  }

  let totalResultsCount = 0;

  if (filteredResponse.web && filteredResponse.web.length > 0) {
    if (filteredResponse.web.length > limit) {
      filteredResponse.web = filteredResponse.web.slice(0, limit);
    }
    totalResultsCount += filteredResponse.web.length;
  }

  if (filteredResponse.images && filteredResponse.images.length > 0) {
    if (filteredResponse.images.length > limit) {
      filteredResponse.images = filteredResponse.images.slice(0, limit);
    }
    totalResultsCount += filteredResponse.images.length;
  }

  if (filteredResponse.news && filteredResponse.news.length > 0) {
    if (filteredResponse.news.length > limit) {
      filteredResponse.news = filteredResponse.news.slice(0, limit);
    }
    totalResultsCount += filteredResponse.news.length;
  }

  const isZDR = options.enterprise?.includes("zdr");
  const creditsPerTenResults = isZDR ? 10 : 2;
  const searchCredits =
    Math.ceil(totalResultsCount / 10) * creditsPerTenResults;
  let scrapeCredits = 0;

  const shouldScrape =
    scrapeOptions?.formats && scrapeOptions.formats.length > 0;

  if (shouldScrape && scrapeOptions) {
    const itemsToScrape = getItemsToScrape(filteredResponse, flags);

    if (itemsToScrape.length > 0) {
      const scrapeOpts = {
        teamId,
        origin,
        timeout: options.timeout,
        scrapeOptions,
        bypassBilling: bypassBilling ?? false,
        apiKeyId,
        zeroDataRetention,
        requestId,
      };

      const allDocsWithCostTracking = await scrapeSearchResults(
        itemsToScrape.map(i => i.scrapeInput),
        scrapeOpts,
        logger,
        flags,
      );

      mergeScrapedContent(
        filteredResponse,
        itemsToScrape,
        allDocsWithCostTracking,
      );
      scrapeCredits = calculateScrapeCredits(allDocsWithCostTracking);
    }
  }

  return {
    response: filteredResponse,
    totalResultsCount,
    searchCredits,
    scrapeCredits,
    totalCredits: searchCredits + scrapeCredits,
    shouldScrape: shouldScrape ?? false,
    enforcementSummary: summary,
  };
}
