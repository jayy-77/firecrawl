import robotsParser from "robots-parser";
import { isUrlAllowedByRobots } from "./robots-policy";

describe("isUrlAllowedByRobots", () => {
  it("respects User-agent: Firecrawl blocks", () => {
    const robotsTxt = `
User-agent: Firecrawl
Disallow: /private
`;
    const robots = robotsParser("https://example.com/robots.txt", robotsTxt);

    expect(
      isUrlAllowedByRobots("https://example.com/private", robots),
    ).toBe(false);
    expect(isUrlAllowedByRobots("https://example.com/public", robots)).toBe(
      true,
    );
  });

  it("defaults to allowed when no robots checker is available", () => {
    expect(isUrlAllowedByRobots("https://example.com/", null)).toBe(true);
  });
});

