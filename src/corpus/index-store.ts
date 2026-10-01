import type { SitemapEntry } from "@/corpus/sitemap";

export type IndexEntry = SitemapEntry & {
  fetchedAt: string | null;
  missingSince: string | null;
};
export type CorpusIndex = {
  scannedAt: string;
  entries: Record<string, IndexEntry>;
};

/**
 * N20: merge a fresh sitemap scan into the previous index. Discovery is an observation, not memory:
 * an entry absent from this scan is marked missing, never deleted.
 */
export function mergeScan(
  prev: CorpusIndex | null,
  scan: SitemapEntry[],
  now: string,
): CorpusIndex {
  const entries: Record<string, IndexEntry> = {};
  const seen = new Set<number>();
  for (const e of scan) {
    const old = prev?.entries[e.id];
    entries[e.id] = {
      ...e,
      fetchedAt: old?.fetchedAt ?? null,
      missingSince: null,
    };
    seen.add(e.id);
  }
  for (const old of Object.values(prev?.entries ?? {})) {
    if (!seen.has(old.id))
      entries[old.id] = { ...old, missingSince: old.missingSince ?? now };
  }
  return { scannedAt: now, entries };
}

/** Entries whose page changed since we last fetched it (or never fetched). */
export function needsFetch(e: IndexEntry): boolean {
  if (e.missingSince) return false;
  if (!e.fetchedAt) return true;
  return e.lastmod !== null && Date.parse(e.lastmod) > Date.parse(e.fetchedAt);
}

export function completeness(prev: CorpusIndex | null, next: CorpusIndex) {
  const before = Object.values(prev?.entries ?? {}).filter(
    (e) => !e.missingSince,
  ).length;
  const present = Object.values(next.entries).filter(
    (e) => !e.missingSince,
  ).length;
  return { before, present, ratio: before ? present / before : 1 };
}
