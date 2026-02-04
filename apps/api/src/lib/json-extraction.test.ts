import { extractJsonFromText } from "./json-extraction";

describe("extractJsonFromText", () => {
  it("parses a fenced ```json code block", () => {
    const res = extractJsonFromText('```json\n{"a":1}\n```');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({ a: 1 });
    }
  });

  it("parses a fenced generic code block", () => {
    const res = extractJsonFromText('```\n{"a":1}\n```');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({ a: 1 });
    }
  });

  it("parses JSON embedded in surrounding text", () => {
    const res = extractJsonFromText(
      'Sure! Here you go:\n\n{"a":1,"b":[2,3]}\n\nThanks.',
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({ a: 1, b: [2, 3] });
    }
  });

  it("returns ok=false when no JSON is present", () => {
    const res = extractJsonFromText("no json here");
    expect(res.ok).toBe(false);
  });
});

