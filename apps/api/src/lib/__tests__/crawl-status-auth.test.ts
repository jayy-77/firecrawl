import { getCrawlStatusAuthContext } from "../crawl-status-auth";

describe("getCrawlStatusAuthContext", () => {
  const crawlId = "00000000-0000-0000-0000-000000000000";
  const teamId = "team_123";

  const group = {
    id: crawlId,
    status: "active",
    createdAt: new Date(),
    ownerId: teamId,
    ttl: 86400000,
  } as any;

  it("authorizes when group exists and crawl metadata matches team", async () => {
    const crawlGroup = {
      getGroup: jest.fn().mockResolvedValue(group),
      addGroup: jest.fn(),
    };
    const scrapeQueue = {
      getGroupAnyJobInModes: jest.fn().mockResolvedValue(null),
    };
    const getCrawl = jest.fn().mockResolvedValue({ team_id: teamId });

    const res = await getCrawlStatusAuthContext({
      crawlId,
      teamId,
      crawlGroup,
      scrapeQueue,
      getCrawl,
    });

    expect(res.authorized).toBe(true);
    expect(res.group).toBe(group);
    expect(crawlGroup.addGroup).not.toHaveBeenCalled();
    expect(scrapeQueue.getGroupAnyJobInModes).toHaveBeenCalledWith(
      crawlId,
      teamId,
      ["single_urls", "kickoff", "kickoff_sitemap"],
    );
  });

  it("authorizes when group exists and kickoff job exists even if crawl metadata is missing", async () => {
    const crawlGroup = {
      getGroup: jest.fn().mockResolvedValue(group),
      addGroup: jest.fn(),
    };
    const scrapeQueue = {
      getGroupAnyJobInModes: jest.fn().mockResolvedValue({ id: "job" }),
    };
    const getCrawl = jest.fn().mockResolvedValue(null);

    const res = await getCrawlStatusAuthContext({
      crawlId,
      teamId,
      crawlGroup,
      scrapeQueue,
      getCrawl,
    });

    expect(res.authorized).toBe(true);
    expect(crawlGroup.addGroup).not.toHaveBeenCalled();
  });

  it("backfills group when missing but crawl metadata proves ownership", async () => {
    const crawlGroup = {
      getGroup: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(group),
      addGroup: jest.fn().mockResolvedValue(group),
    };
    const scrapeQueue = {
      getGroupAnyJobInModes: jest.fn().mockResolvedValue(null),
    };
    const getCrawl = jest.fn().mockResolvedValue({ team_id: teamId });

    const res = await getCrawlStatusAuthContext({
      crawlId,
      teamId,
      crawlGroup,
      scrapeQueue,
      getCrawl,
    });

    expect(crawlGroup.addGroup).toHaveBeenCalledWith(crawlId, teamId);
    expect(res.group).toBe(group);
    expect(res.authorized).toBe(true);
  });

  it("backfills group when missing but kickoff job proves ownership", async () => {
    const crawlGroup = {
      getGroup: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(group),
      addGroup: jest.fn().mockResolvedValue(group),
    };
    const scrapeQueue = {
      getGroupAnyJobInModes: jest.fn().mockResolvedValue({ id: "job" }),
    };
    const getCrawl = jest.fn().mockResolvedValue(null);

    const res = await getCrawlStatusAuthContext({
      crawlId,
      teamId,
      crawlGroup,
      scrapeQueue,
      getCrawl,
    });

    expect(crawlGroup.addGroup).toHaveBeenCalledWith(crawlId, teamId);
    expect(res.group).toBe(group);
    expect(res.authorized).toBe(true);
  });

  it("does not authorize when ownership cannot be proven", async () => {
    const crawlGroup = {
      getGroup: jest.fn().mockResolvedValue(group),
      addGroup: jest.fn(),
    };
    const scrapeQueue = {
      getGroupAnyJobInModes: jest.fn().mockResolvedValue(null),
    };
    const getCrawl = jest.fn().mockResolvedValue({ team_id: "other_team" });

    const res = await getCrawlStatusAuthContext({
      crawlId,
      teamId,
      crawlGroup,
      scrapeQueue,
      getCrawl,
    });

    expect(res.authorized).toBe(false);
    expect(crawlGroup.addGroup).not.toHaveBeenCalled();
  });
});

