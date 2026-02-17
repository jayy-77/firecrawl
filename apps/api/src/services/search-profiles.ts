import { SearchV2Response } from "../lib/entities";
import {
  DomainFilters,
  WildcardPolicy,
  extractHostname,
  normalizeDomain,
  shouldIncludeHostname,
} from "../lib/domain-utils";

export interface SearchProfile {
  profileId: string;
  name: string;
  allowlist: string[];
  denylist: string[];
  wildcardPolicy: WildcardPolicy;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchProfileInput {
  profileId: string;
  name: string;
  allowlist: string[];
  denylist?: string[];
  wildcardPolicy?: WildcardPolicy;
}

export interface SearchProfileUpdateInput {
  name?: string;
  allowlist?: string[];
  denylist?: string[];
  wildcardPolicy?: WildcardPolicy;
}

export interface DomainOverrides {
  allowedDomains?: string[];
  blockedDomains?: string[];
}

export interface EnforcementSummary {
  appliedProfileId?: string;
  profileVersion?: number;
  effectiveDomainCount: number;
  allowedOverrideCount: number;
  blockedOverrideCount: number;
}

const profiles = new Map<string, SearchProfile>();

export function createSearchProfile(input: SearchProfileInput): SearchProfile {
  const now = new Date();
  const existing = profiles.get(input.profileId);

  const baseVersion = existing ? existing.version + 1 : 1;

  const allowlist = (input.allowlist || [])
    .map(normalizeDomain)
    .filter((d): d is string => !!d);
  const denylist = (input.denylist || [])
    .map(normalizeDomain)
    .filter((d): d is string => !!d);

  const profile: SearchProfile = {
    profileId: input.profileId,
    name: input.name,
    allowlist,
    denylist,
    wildcardPolicy: input.wildcardPolicy ?? "none",
    version: baseVersion,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  profiles.set(profile.profileId, profile);
  return profile;
}

export function updateSearchProfile(
  profileId: string,
  input: SearchProfileUpdateInput,
): SearchProfile | null {
  const existing = profiles.get(profileId);
  if (!existing) return null;

  const now = new Date();

  const allowlist =
    input.allowlist !== undefined
      ? input.allowlist
          .map(normalizeDomain)
          .filter((d): d is string => !!d)
      : existing.allowlist;

  const denylist =
    input.denylist !== undefined
      ? input.denylist
          .map(normalizeDomain)
          .filter((d): d is string => !!d)
      : existing.denylist;

  const profile: SearchProfile = {
    ...existing,
    name: input.name ?? existing.name,
    allowlist,
    denylist,
    wildcardPolicy: input.wildcardPolicy ?? existing.wildcardPolicy,
    version: existing.version + 1,
    updatedAt: now,
  };

  profiles.set(profile.profileId, profile);
  return profile;
}

export function getSearchProfile(profileId: string): SearchProfile | null {
  return profiles.get(profileId) ?? null;
}

function buildDomainFilters(
  profile: SearchProfile | null,
  overrides?: DomainOverrides,
): { filters: DomainFilters | null; summary: EnforcementSummary | null } {
  const allowFromProfile = profile?.allowlist ?? [];
  const denyFromProfile = profile?.denylist ?? [];

  const overrideAllowed = (overrides?.allowedDomains ?? [])
    .map(normalizeDomain)
    .filter((d): d is string => !!d);
  const overrideBlocked = (overrides?.blockedDomains ?? [])
    .map(normalizeDomain)
    .filter((d): d is string => !!d);

  const combinedAllow = Array.from(
    new Set([...allowFromProfile, ...overrideAllowed]),
  );
  const combinedDeny = Array.from(
    new Set([...denyFromProfile, ...overrideBlocked]),
  );

  if (!profile && combinedAllow.length === 0 && combinedDeny.length === 0) {
    return { filters: null, summary: null };
  }

  const filters: DomainFilters = {
    allowlist: combinedAllow,
    denylist: combinedDeny,
    wildcardPolicy: profile?.wildcardPolicy ?? "none",
  };

  const summary: EnforcementSummary = {
    appliedProfileId: profile?.profileId,
    profileVersion: profile?.version,
    effectiveDomainCount: combinedAllow.length,
    allowedOverrideCount: overrideAllowed.length,
    blockedOverrideCount: overrideBlocked.length,
  };

  return { filters, summary };
}

export function enforceSearchProfile(
  response: SearchV2Response,
  profileId?: string,
  overrides?: DomainOverrides,
): { response: SearchV2Response; summary: EnforcementSummary | null } {
  const profile = profileId ? getSearchProfile(profileId) : null;
  const { filters, summary } = buildDomainFilters(profile, overrides);

  if (!filters) {
    return { response, summary: null };
  }

  const filterList = <
    T extends { url: string } & Record<string, unknown>,
  >(
    items: T[] | undefined,
  ): T[] | undefined => {
    if (!items || items.length === 0) return items;
    return items.filter(item => {
      const host = extractHostname(item.url);
      if (!host) return false;
      return shouldIncludeHostname(host, filters);
    });
  };

  const next: SearchV2Response = {
    ...response,
    web: filterList(response.web),
    news: filterList(response.news),
    images: filterList(response.images),
  };

  return { response: next, summary };
}

