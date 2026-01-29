describe("firecrawl-user-agent config override", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.FIRECRAWL_USER_AGENT;
  });

  it("enforces token when existing User-Agent is empty", async () => {
    process.env.FIRECRAWL_USER_AGENT = "CustomUA/1.0";

    const { withFirecrawlUserAgent } = await import("./firecrawl-user-agent");

    const headers = withFirecrawlUserAgent({ "User-Agent": "" });
    expect(headers["User-Agent"]).toBe("CustomUA/1.0 Firecrawl");
  });
});

