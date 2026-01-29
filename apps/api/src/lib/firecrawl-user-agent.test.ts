import {
  FIRECRAWL_USER_AGENT_TOKEN,
  withFirecrawlUserAgent,
} from "./firecrawl-user-agent";

describe("withFirecrawlUserAgent", () => {
  it("sets a user-agent when none is provided", () => {
    const headers = withFirecrawlUserAgent(undefined);
    const ua = headers["User-Agent"];
    expect(typeof ua).toBe("string");
    expect(ua.toLowerCase()).toContain(FIRECRAWL_USER_AGENT_TOKEN.toLowerCase());
  });

  it("appends the token to an existing User-Agent", () => {
    const headers = withFirecrawlUserAgent({ "User-Agent": "CustomUA/1.0" });
    expect(headers["User-Agent"]).toContain("CustomUA/1.0");
    expect(headers["User-Agent"].toLowerCase()).toContain(
      FIRECRAWL_USER_AGENT_TOKEN.toLowerCase(),
    );
  });

  it("does not double-append when token already exists", () => {
    const headers = withFirecrawlUserAgent({
      "User-Agent": `Something ${FIRECRAWL_USER_AGENT_TOKEN}/1.0`,
    });
    expect(headers["User-Agent"]).toBe(
      `Something ${FIRECRAWL_USER_AGENT_TOKEN}/1.0`,
    );
  });

  it("preserves lower-case header key", () => {
    const headers = withFirecrawlUserAgent({ "user-agent": "CustomUA/1.0" });
    expect(headers["user-agent"]).toBeDefined();
    expect(headers["user-agent"].toLowerCase()).toContain(
      FIRECRAWL_USER_AGENT_TOKEN.toLowerCase(),
    );
  });

  it("supports Headers input", () => {
    const h = new Headers();
    h.set("User-Agent", "CustomUA/1.0");
    const headers = withFirecrawlUserAgent(h);
    const ua = headers["User-Agent"] ?? headers["user-agent"];
    expect(ua).toBeDefined();
    expect(ua!.toLowerCase()).toContain(
      FIRECRAWL_USER_AGENT_TOKEN.toLowerCase(),
    );
  });

  it("supports tuple-array headers input", () => {
    const headers = withFirecrawlUserAgent([["User-Agent", "CustomUA/1.0"]]);
    expect(headers["User-Agent"].toLowerCase()).toContain(
      FIRECRAWL_USER_AGENT_TOKEN.toLowerCase(),
    );
  });
});

