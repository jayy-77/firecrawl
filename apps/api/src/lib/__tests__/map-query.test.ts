import { buildFireEngineMapQuery } from "../map-query";

describe("buildFireEngineMapQuery", () => {
  it("builds a site: query from canonical hostname", () => {
    expect(
      buildFireEngineMapQuery({
        url: "https://www.deztrox.ai/",
      }),
    ).toBe("site:deztrox.ai");
  });

  it("drops protocol, path, query, and fragment from site target", () => {
    expect(
      buildFireEngineMapQuery({
        url: "https://www.example.com/foo/bar?x=1#section",
      }),
    ).toBe("site:example.com");
  });

  it("keeps non-www subdomains", () => {
    expect(
      buildFireEngineMapQuery({
        url: "https://docs.example.com/path",
      }),
    ).toBe("site:docs.example.com");
  });

  it("adds a domain-restricted query when search is provided", () => {
    expect(
      buildFireEngineMapQuery({
        url: "https://www.example.com",
        search: "pricing",
        allowExternalLinks: false,
      }),
    ).toBe("pricing site:example.com");
  });

  it("anchors but does not hard-restrict when external links are allowed", () => {
    expect(
      buildFireEngineMapQuery({
        url: "https://www.example.com",
        search: "pricing",
        allowExternalLinks: true,
      }),
    ).toBe("pricing example.com");
  });

  it("treats blank search as no search", () => {
    expect(
      buildFireEngineMapQuery({
        url: "https://www.example.com",
        search: "   ",
      }),
    ).toBe("site:example.com");
  });
});

