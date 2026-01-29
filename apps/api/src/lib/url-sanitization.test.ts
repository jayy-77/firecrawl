import { stripAuthorityUserInfo, stripUrlUserInfo } from "./url-sanitization";

describe("stripUrlUserInfo", () => {
  it("returns input unchanged when no userinfo is present", () => {
    const url = "https://example.com/path";
    expect(stripUrlUserInfo(url)).toBe(url);
  });

  it("strips username only", () => {
    const url = "https://user@example.com/path";
    expect(stripUrlUserInfo(url)).toBe("https://example.com/path");
  });

  it("strips username and password", () => {
    const url = "https://user:pass@example.com/";
    expect(stripUrlUserInfo(url)).toBe("https://example.com/");
  });

  it("does not modify non-http(s) URLs", () => {
    const url = "mailto:test@example.com";
    expect(stripUrlUserInfo(url)).toBe(url);
  });

  it("does not throw on invalid URLs", () => {
    const url = "not a url";
    expect(stripUrlUserInfo(url)).toBe(url);
  });
});

describe("stripAuthorityUserInfo", () => {
  it("strips userinfo from an authority-only string", () => {
    expect(stripAuthorityUserInfo("user:pass@www.example.com/path")).toBe(
      "www.example.com/path",
    );
  });

  it("strips username from a host without protocol", () => {
    expect(stripAuthorityUserInfo("user@domain.com")).toBe("domain.com");
  });

  it("leaves strings without userinfo unchanged", () => {
    expect(stripAuthorityUserInfo("www.example.com/path")).toBe(
      "www.example.com/path",
    );
  });

  it("does not treat '@' in the path as authority userinfo", () => {
    expect(stripAuthorityUserInfo("example.com/path@foo")).toBe(
      "example.com/path@foo",
    );
  });
});

