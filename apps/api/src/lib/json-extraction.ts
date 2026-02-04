export type ExtractJsonFromTextResult =
  | { ok: true; jsonText: string; value: unknown }
  | { ok: false; jsonText?: string };

function stripCodeFences(text: string): string {
  let t = text.trim();
  if (!t.startsWith("```")) return t;

  // Opening fence: ```json or ```<lang>
  const firstNewline = t.indexOf("\n");
  if (firstNewline === -1) return t;
  t = t.slice(firstNewline + 1);

  // Closing fence
  const lastFence = t.lastIndexOf("```");
  if (lastFence !== -1) {
    t = t.slice(0, lastFence);
  }
  return t.trim();
}

function extractFirstCodeFence(text: string): string | null {
  const start = text.indexOf("```");
  if (start === -1) return null;
  const afterStart = text.slice(start);
  const end = afterStart.indexOf("```", "```".length);
  if (end === -1) return null;

  return stripCodeFences(afterStart.slice(0, end + "```".length));
}

function extractFirstBalancedJsonLike(text: string): string | null {
  const t = text.trim();
  if (t.length === 0) return null;

  // Prefer object-like extraction; fall back to arrays.
  const objStart = t.indexOf("{");
  const objEnd = t.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    return t.slice(objStart, objEnd + 1);
  }

  const arrStart = t.indexOf("[");
  const arrEnd = t.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    return t.slice(arrStart, arrEnd + 1);
  }

  return null;
}

export function extractJsonFromText(text: string): ExtractJsonFromTextResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false };

  // 1) Whole response is a fenced code block.
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    const jsonText = stripCodeFences(trimmed);
    try {
      return { ok: true, jsonText, value: JSON.parse(jsonText) };
    } catch {
      return { ok: false, jsonText };
    }
  }

  // 2) Response contains a fenced code block.
  const firstFence = extractFirstCodeFence(trimmed);
  if (firstFence) {
    try {
      return { ok: true, jsonText: firstFence, value: JSON.parse(firstFence) };
    } catch {
      // fall through to bracket extraction
    }
  }

  // 3) Bracket-based extraction (handles "Sure, here's the JSON: {...}").
  const bracketJson = extractFirstBalancedJsonLike(trimmed);
  if (bracketJson) {
    try {
      return { ok: true, jsonText: bracketJson, value: JSON.parse(bracketJson) };
    } catch {
      return { ok: false, jsonText: bracketJson };
    }
  }

  // 4) Final attempt: treat whole response as JSON.
  try {
    return { ok: true, jsonText: trimmed, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false, jsonText: trimmed };
  }
}

