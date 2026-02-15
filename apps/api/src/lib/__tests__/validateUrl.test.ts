import { getHostnameWithoutWww } from "../validateUrl";

describe("validateUrl", () => {
  describe("getHostnameWithoutWww", () => {
    it("strips leading www from http(s) URLs", () => {
      expect(getHostnameWithoutWww("https://www.deztrox.ai/")).toBe(
        "deztrox.ai",
      );
      expect(getHostnameWithoutWww("http://www.example.com/path")).toBe(
        "example.com",
      );
    });

    it("does not modify non-www hostnames", () => {
      expect(getHostnameWithoutWww("https://example.com")).toBe("example.com");
      expect(getHostnameWithoutWww("https://sub.example.com")).toBe(
        "sub.example.com",
      );
    });

    it("handles URLs without protocol", () => {
      expect(getHostnameWithoutWww("www.example.com/foo")).toBe("example.com");
      expect(getHostnameWithoutWww("example.com/foo")).toBe("example.com");
    });

    it("is case-insensitive for www prefix", () => {
      expect(getHostnameWithoutWww("https://WWW.Example.com/")).toBe(
        "example.com",
      );
    });

    it("returns best-effort hostname for invalid URLs", () => {
      expect(getHostnameWithoutWww("not a url")).toBe("not a url");
    });
  });
});

