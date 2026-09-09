import { v } from 'convex/values';

import { cardIdsIn, compactChanges, countChanges } from '../shared/changes';
import { internal } from './_generated/api';
import { action, internalMutation, internalQuery } from './_generated/server';
import { runAutoSquash } from './squashes';

const BASE = 'https://cubecobra.com';
const PAGE_DELAY_MS = 150;
const ENTRY_BATCH = 25;
const CARD_BATCH = 100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'cubesquash (self-hosted changelog viewer)' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cube Cobra returned ${res.status} for ${path}`);
  return (await res.json()) as T;
}

type RawPost = { id: string; cubeId: string; date: number; changelog: unknown };
type RawBlog = { id?: string; date?: number; title?: string; body?: string | null; changelist?: string };
type BlogInfo = { id: string; title: string; body: string; date: number };
const BLOG_BODY_LIMIT = 8000;
const BLOG_LOOKBACK_MS = 24 * 60 * 60 * 1000;

async function fetchLinkedBlogs(cubeId: string, oldestNeeded: number): Promise<Map<string, BlogInfo>> {
  const out = new Map<string, BlogInfo>();
  let lastKey: unknown = null;
  for (let page = 0; page < 200; page++) {
    let res: { items?: RawBlog[]; lastKey?: unknown };
    try {
      res = await post(`/cube/blog/getmoreblogsbycube/${cubeId}`, { lastKey });
    } catch {
      break;
    }
    const items = res.items ?? [];
    for (const b of items) {
      if (!b.id || !b.changelist) continue;
      out.set(b.changelist, {
        id: b.id,
        title: (b.title ?? '').trim(),
        body: (b.body ?? '').slice(0, BLOG_BODY_LIMIT),
        date: typeof b.date === 'number' ? b.date : 0,
      });
    }
    const oldest = items.reduce((m, b) => Math.min(m, typeof b.date === 'number' ? b.date : m), Infinity);
    lastKey = res.lastKey ?? null;
    if (!lastKey || !items.length || oldest < oldestNeeded - BLOG_LOOKBACK_MS) break;
    await sleep(PAGE_DELAY_MS);
  }
  return out;
}

export const knownChangelogIds = internalQuery({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    const entries = await ctx.db
      .query('entries')
      .withIndex('by_cube_date', (q) => q.eq('cubeId', cubeId))
      .collect();
    return entries.map((e) => e.changelogId);
  },
});

export const cubeState = internalQuery({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    const cube = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
      .unique();
    return cube ? { fullySynced: cube.fullySynced } : null;
  },
});

export const upsertCube = internalMutation({
  args: {
    cubeId: v.string(),
    shortId: v.string(),
    name: v.string(),
    imageUri: v.optional(v.string()),
    imageArtist: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    cardCount: v.optional(v.number()),
    fullySynced: v.boolean(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('entries')
      .withIndex('by_cube_date', (q) => q.eq('cubeId', args.cubeId))
      .collect();
    const existing = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', args.cubeId))
      .unique();
    const doc = { ...args, lastSyncedAt: Date.now(), entryCount: entries.length };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert('cubes', { ...doc, hideNonCardChanges: true, netOut: false });
    }
  },
});

export const upsertEntries = internalMutation({
  args: {
    entries: v.array(
      v.object({
        cubeId: v.string(),
        changelogId: v.string(),
        date: v.number(),
        cubeVersion: v.optional(v.number()),
        changes: v.any(),
        counts: v.object({ adds: v.number(), removes: v.number(), swaps: v.number(), edits: v.number() }),
        blog: v.optional(v.object({ id: v.string(), title: v.string(), body: v.string(), date: v.number() })),
      }),
    ),
  },
  handler: async (ctx, { entries }) => {
    for (const entry of entries) {
      const existing = await ctx.db
        .query('entries')
        .withIndex('by_changelogId', (q) => q.eq('changelogId', entry.changelogId))
        .unique();
      if (existing) {
        await ctx.db.replace(existing._id, entry);
      } else {
        await ctx.db.insert('entries', entry);
      }
    }
  },
});

export const missingCardIds = internalQuery({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const missing: string[] = [];
    for (const id of ids) {
      const card = await ctx.db
        .query('cards')
        .withIndex('by_cardID', (q) => q.eq('cardID', id))
        .unique();
      if (!card) missing.push(id);
    }
    return missing;
  },
});

export const insertCards = internalMutation({
  args: {
    cards: v.array(
      v.object({
        cardID: v.string(),
        name: v.string(),
        imageSmall: v.optional(v.string()),
        imageNormal: v.optional(v.string()),
        colorCategory: v.optional(v.string()),
        cmc: v.optional(v.number()),
        type: v.optional(v.string()),
        set: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { cards }) => {
    for (const card of cards) {
      const existing = await ctx.db
        .query('cards')
        .withIndex('by_cardID', (q) => q.eq('cardID', card.cardID))
        .unique();
      if (!existing) await ctx.db.insert('cards', card);
    }
  },
});

type CubeMeta = {
  id: string;
  shortId?: string;
  name?: string;
  image?: { uri?: string; artist?: string };
  owner?: { username?: string } | string;
  cardCount?: number;
};

export const syncCube = action({
  args: { id: v.string() },
  handler: async (ctx, { id }): Promise<{ cubeId: string; shortId: string; added: number }> => {
    const trimmed = id.trim();
    if (!trimmed) throw new Error('Enter a cube ID');

    let meta: { cube?: CubeMeta };
    try {
      meta = await post<{ cube?: CubeMeta }>(`/cube/api/cubemetadata/${encodeURIComponent(trimmed)}`, {});
    } catch {
      throw new Error(`Cube "${trimmed}" was not found on Cube Cobra (or it is private).`);
    }
    const cube = meta.cube;
    if (!cube?.id) throw new Error(`Cube "${trimmed}" was not found on Cube Cobra (or it is private).`);
    const cubeId = cube.id;
    const shortId = (cube.shortId || cubeId).toLowerCase();

    const state = await ctx.runQuery(internal.sync.cubeState, { cubeId });
    const known = new Set(await ctx.runQuery(internal.sync.knownChangelogIds, { cubeId }));
    const stopAtKnown = state?.fullySynced ?? false;

    const fresh: RawPost[] = [];
    let lastKey: unknown = null;
    let reachedEnd = false;
    let hitKnown = false;
    while (!hitKnown) {
      const page = await post<{ posts: RawPost[]; lastKey: unknown }>('/cube/getmorechangelogs', { cubeId, lastKey });
      for (const p of page.posts ?? []) {
        if (known.has(p.id)) {
          if (stopAtKnown) {
            hitKnown = true;
            break;
          }
          continue;
        }
        fresh.push(p);
      }
      lastKey = page.lastKey ?? null;
      if (!lastKey) {
        reachedEnd = true;
        break;
      }
      await sleep(PAGE_DELAY_MS);
    }

    const oldestFresh = fresh.reduce((m, p) => Math.min(m, p.date), Infinity);
    const blogs = fresh.length ? await fetchLinkedBlogs(cubeId, oldestFresh) : new Map<string, BlogInfo>();

    const compacted = fresh.map((p) => {
      const changes = compactChanges(p.changelog);
      const version = (p.changelog as { version?: unknown } | null)?.version;
      return {
        cubeId,
        changelogId: p.id,
        date: p.date,
        cubeVersion: typeof version === 'number' ? version : undefined,
        changes,
        counts: countChanges(changes),
        blog: blogs.get(p.id),
      };
    });

    for (let i = 0; i < compacted.length; i += ENTRY_BATCH) {
      await ctx.runMutation(internal.sync.upsertEntries, { entries: compacted.slice(i, i + ENTRY_BATCH) });
    }

    const allIds = new Set<string>();
    for (const c of compacted) for (const cid of cardIdsIn(c.changes)) allIds.add(cid);
    const missing = await ctx.runQuery(internal.sync.missingCardIds, { ids: [...allIds] });
    for (let i = 0; i < missing.length; i += CARD_BATCH) {
      const batch = missing.slice(i, i + CARD_BATCH);
      const res = await post<{ details?: Array<Record<string, unknown>> }>('/cube/api/getdetailsforcards', {
        cards: batch,
      });
      const details = res.details ?? [];
      const cards = details.flatMap((d, idx) => {
        const cardID = typeof d.scryfall_id === 'string' && d.scryfall_id.length ? d.scryfall_id : batch[idx];
        if (!cardID) return [];
        const name = typeof d.name === 'string' ? d.name : 'Unknown Card';
        return [
          {
            cardID,
            name,
            imageSmall: typeof d.image_small === 'string' ? d.image_small : undefined,
            imageNormal: typeof d.image_normal === 'string' ? d.image_normal : undefined,
            colorCategory: typeof d.colorcategory === 'string' ? d.colorcategory : undefined,
            cmc: typeof d.cmc === 'number' ? d.cmc : undefined,
            type: typeof d.type === 'string' ? d.type : undefined,
            set: typeof d.set === 'string' ? d.set : undefined,
          },
        ];
      });
      await ctx.runMutation(internal.sync.insertCards, { cards });
      await sleep(PAGE_DELAY_MS);
    }

    const ownerName =
      typeof cube.owner === 'string' ? cube.owner : typeof cube.owner?.username === 'string' ? cube.owner.username : undefined;

    await ctx.runMutation(internal.sync.upsertCube, {
      cubeId,
      shortId,
      name: cube.name ?? shortId,
      imageUri: cube.image?.uri,
      imageArtist: cube.image?.artist,
      ownerName,
      cardCount: typeof cube.cardCount === 'number' ? cube.cardCount : undefined,
      fullySynced: reachedEnd || stopAtKnown,
    });

    await ctx.runMutation(internal.sync.autoSquashIfEnabled, { cubeId });

    return { cubeId, shortId, added: compacted.length };
  },
});

export const autoSquashIfEnabled = internalMutation({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    const cube = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
      .unique();
    if (!cube || cube.autoSquash === false) return 0;
    if (cube.autoSquash === undefined) await ctx.db.patch(cube._id, { autoSquash: true });
    return await runAutoSquash(ctx, cubeId);
  },
});
