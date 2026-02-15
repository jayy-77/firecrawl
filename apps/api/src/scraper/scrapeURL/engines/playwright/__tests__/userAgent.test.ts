import { splitUserAgentFromHeaders } from "../userAgent";

describe("splitUserAgentFromHeaders", () => {
  it("returns empty result when headers are undefined", () => {
    expect(splitUserAgentFromHeaders(undefined)).toEqual({});
  });

  it("extracts user-agent and removes it from headers", () => {
    expect(
      splitUserAgentFromHeaders({
        "user-agent": "MyAgent/1.0",
        accept: "text/html",
      }),
    ).toEqual({
      userAgent: "MyAgent/1.0",
      headers: { accept: "text/html" },
    });
  });

  it("handles header casing", () => {
    expect(
      splitUserAgentFromHeaders({
        "User-Agent": "UA",
      }),
    ).toEqual({
      userAgent: "UA",
      headers: undefined,
    });
  });

  it("ignores empty/whitespace user-agent values", () => {
    expect(
      splitUserAgentFromHeaders({
        "user-agent": "   ",
        accept: "text/plain",
      }),
    ).toEqual({
      userAgent: undefined,
      headers: { accept: "text/plain" },
    });
  });

  it("uses the last non-empty user-agent when multiple keys exist", () => {
    expect(
      splitUserAgentFromHeaders({
        "User-Agent": "A",
        "user-agent": "B",
      }),
    ).toEqual({
      userAgent: "B",
      headers: undefined,
    });
  });
});

