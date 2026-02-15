export function splitUserAgentFromHeaders(
  headers?: Record<string, string>,
): {
  userAgent?: string;
  headers?: Record<string, string>;
} {
  if (!headers) return {};

  let userAgent: string | undefined;
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "user-agent") {
      const trimmed = value.trim();
      if (trimmed) userAgent = trimmed;
      continue;
    }
    out[key] = value;
  }

  return {
    userAgent,
    headers: Object.keys(out).length > 0 ? out : undefined,
  };
}

