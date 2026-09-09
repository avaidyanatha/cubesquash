export type PostLike = { date: number; changelist?: string };
export type EntryLike = { changelogId: string; date: number; blog?: unknown };

export const ATTACH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Maps posts that were not committed with a changelist onto the nearest
 * changelog entry within the window, one post per entry, closest pairs first.
 * Returns changelogId -> index into `posts`.
 */
export function attachUnlinkedPosts(
  entries: EntryLike[],
  posts: PostLike[],
  windowMs = ATTACH_WINDOW_MS,
): Map<string, number> {
  const candidates: Array<{ dist: number; entry: string; post: number }> = [];
  posts.forEach((p, i) => {
    if (p.changelist) return;
    for (const e of entries) {
      if (e.blog) continue;
      const dist = Math.abs(e.date - p.date);
      if (dist <= windowMs) candidates.push({ dist, entry: e.changelogId, post: i });
    }
  });
  candidates.sort((a, b) => a.dist - b.dist);
  const out = new Map<string, number>();
  const usedPosts = new Set<number>();
  for (const c of candidates) {
    if (out.has(c.entry) || usedPosts.has(c.post)) continue;
    out.set(c.entry, c.post);
    usedPosts.add(c.post);
  }
  return out;
}
