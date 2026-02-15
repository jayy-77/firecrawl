import { getHostnameWithoutWww } from "./validateUrl";

export function buildFireEngineMapQuery({
  url,
  search,
  allowExternalLinks,
}: {
  url: string;
  search?: string;
  allowExternalLinks?: boolean;
}): string {
  const siteTarget = getHostnameWithoutWww(url);
  const q = (search ?? "").trim();

  if (!q) {
    return `site:${siteTarget}`;
  }

  // If external links are allowed, don't hard-restrict to a domain, but still
  // anchor the query to the requested site.
  if (allowExternalLinks) {
    return `${q} ${siteTarget}`;
  }

  return `${q} site:${siteTarget}`;
}

