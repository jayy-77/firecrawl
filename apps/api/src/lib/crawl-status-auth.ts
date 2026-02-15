import type { StoredCrawl } from "./crawl-redis";
import type { NuQJob, NuQJobGroupInstance } from "../services/worker/nuq";

export type CrawlGroupLike = {
  getGroup(id: string): Promise<NuQJobGroupInstance | null>;
  addGroup(
    id: string,
    ownerId: string,
    ttl?: number,
  ): Promise<NuQJobGroupInstance>;
};

export type ScrapeQueueLike = {
  getGroupAnyJobInModes(
    groupId: string,
    ownerId: string,
    modes: string[],
  ): Promise<NuQJob<any, any> | null>;
};

export async function getCrawlStatusAuthContext({
  crawlId,
  teamId,
  crawlGroup,
  scrapeQueue,
  getCrawl,
  modes = ["single_urls", "kickoff", "kickoff_sitemap"],
}: {
  crawlId: string;
  teamId: string;
  crawlGroup: CrawlGroupLike;
  scrapeQueue: ScrapeQueueLike;
  getCrawl: (id: string) => Promise<StoredCrawl | null>;
  modes?: string[];
}): Promise<{
  group: NuQJobGroupInstance | null;
  groupAnyJob: NuQJob<any, any> | null;
  sc: StoredCrawl | null;
  authorized: boolean;
}> {
  let group = await crawlGroup.getGroup(crawlId);
  const groupAnyJob = await scrapeQueue.getGroupAnyJobInModes(
    crawlId,
    teamId,
    modes,
  );
  const sc = await getCrawl(crawlId);

  const ownedBySc = !!sc && sc.team_id === teamId;

  // Best-effort backfill: ensure the group exists for immediate status queries,
  // even before `single_urls` jobs are enqueued.
  if (!group && (groupAnyJob || ownedBySc)) {
    try {
      await crawlGroup.addGroup(crawlId, teamId);
    } catch {
      // Ignore duplicate/constraint errors; we'll re-read below.
    }
    group = await crawlGroup.getGroup(crawlId);
  }

  const authorized = !!group && (groupAnyJob || ownedBySc);

  return { group, groupAnyJob, sc, authorized };
}

