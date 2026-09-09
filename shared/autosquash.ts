export type AutoEntry = { id: string; date: number; blogTitle?: string };
export type AutoSquash = { id: string; entryIds: string[]; auto: boolean; title?: string };
export type AutoPlan = { entryIds: string[]; title?: string; replaceIds: string[] };

type Unit = {
  entries: AutoEntry[];
  squashId?: string;
  frozen: boolean;
  anchorTitle?: string;
  newest: number;
  oldest: number;
};

export const DEFAULT_AUTO_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Plans auto-squash groups over a cube's timeline.
 *
 * Entries are newest first. Existing squashes are units; manual ones (auto=false)
 * and entries the user explicitly unsquashed are frozen and split the timeline.
 * Within a run of units closer together than `windowMs`, a unit with a blog post
 * is an anchor: with zero or one anchor the whole run merges, with several each
 * other unit joins the nearest anchor in time.
 */
export function planAutoSquash(
  entries: AutoEntry[],
  squashes: AutoSquash[],
  frozenIds: Set<string>,
  windowMs: number,
): AutoPlan[] {
  const sorted = [...entries].sort((a, b) => b.date - a.date);
  const byId = new Map(sorted.map((e) => [e.id, e]));
  const inSquash = new Map<string, AutoSquash>();
  for (const s of squashes) for (const id of s.entryIds) inSquash.set(id, s);

  const units: Unit[] = [];
  const seen = new Set<string>();
  for (const e of sorted) {
    const s = inSquash.get(e.id);
    if (s) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      const group = s.entryIds
        .map((id) => byId.get(id))
        .filter((x): x is AutoEntry => !!x)
        .sort((a, b) => b.date - a.date);
      if (!group.length) continue;
      units.push({
        entries: group,
        squashId: s.id,
        frozen: !s.auto,
        anchorTitle: s.title ?? group.find((g) => g.blogTitle)?.blogTitle,
        newest: group[0].date,
        oldest: group[group.length - 1].date,
      });
    } else {
      units.push({
        entries: [e],
        frozen: frozenIds.has(e.id),
        anchorTitle: e.blogTitle,
        newest: e.date,
        oldest: e.date,
      });
    }
  }

  const runs: Unit[][] = [];
  let current: Unit[] = [];
  for (const u of units) {
    const prev = current[current.length - 1];
    if (u.frozen || (prev && (prev.frozen || prev.oldest - u.newest > windowMs))) {
      if (current.length) runs.push(current);
      current = [];
    }
    current.push(u);
  }
  if (current.length) runs.push(current);

  const plans: AutoPlan[] = [];
  for (const run of runs) {
    if (run.length < 2 || run.some((u) => u.frozen)) continue;
    const anchors = run.filter((u) => u.anchorTitle);
    const clusters: Unit[][] = [];
    if (anchors.length <= 1) {
      clusters.push(run);
    } else {
      const buckets = new Map<Unit, Unit[]>();
      for (const a of anchors) buckets.set(a, []);
      for (const u of run) {
        if (buckets.has(u)) continue;
        const mid = (u.newest + u.oldest) / 2;
        let best = anchors[0];
        let bestDist = Infinity;
        for (const a of anchors) {
          const dist = Math.min(Math.abs(mid - a.newest), Math.abs(mid - a.oldest));
          if (dist < bestDist) {
            bestDist = dist;
            best = a;
          }
        }
        buckets.get(best)!.push(u);
      }
      for (const [a, members] of buckets) {
        clusters.push([...members, a].sort((x, y) => y.newest - x.newest));
      }
    }
    for (const cluster of clusters) {
      if (cluster.length < 2) continue;
      const anchor = cluster.find((u) => u.anchorTitle);
      plans.push({
        entryIds: cluster.flatMap((u) => u.entries.map((e) => e.id)),
        title: anchor?.anchorTitle,
        replaceIds: cluster.flatMap((u) => (u.squashId ? [u.squashId] : [])),
      });
    }
  }
  return plans;
}
