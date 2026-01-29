import { stripAuthorityUserInfo } from "./url-sanitization";

export function normalizeUrl(url: string) {
  url = url.replace(/^https?:\/\//i, "");
  url = stripAuthorityUserInfo(url);
  url = url.replace(/^www\./i, "");
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

export function normalizeUrlOnlyHostname(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch (error) {
    const withoutProtocol = url.replace(/^https?:\/\//i, "");
    const withoutUserInfo = stripAuthorityUserInfo(withoutProtocol);
    return withoutUserInfo.replace(/^www\./i, "").split("/")[0];
  }
}
