import { v } from 'convex/values';

import { DEFAULT_AUTO_WINDOW_MS, planAutoSquash } from '../shared/autosquash';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';

export const byCube = query({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    return await ctx.db
      .query('squashes')
      .withIndex('by_cube', (q) => q.eq('cubeId', cubeId))
      .collect();
  },
});

export const create = mutation({
  args: {
    cubeId: v.string(),
    entryIds: v.array(v.string()),
    replaceIds: v.array(v.id('squashes')),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { cubeId, entryIds, replaceIds, title }) => {
    if (entryIds.length < 2) throw new Error('A squash needs at least two entries');
    for (const id of replaceIds) {
      const existing = await ctx.db.get(id);
      if (existing && existing.cubeId === cubeId) await ctx.db.delete(id);
    }
    return await ctx.db.insert('squashes', { cubeId, entryIds, title, auto: false });
  },
});

export const rename = mutation({
  args: { id: v.id('squashes'), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const trimmed = title.trim();
    await ctx.db.patch(id, { title: trimmed.length ? trimmed : undefined, auto: false });
  },
});

export const remove = mutation({
  args: { id: v.id('squashes') },
  handler: async (ctx, { id }) => {
    const squash = await ctx.db.get(id);
    if (!squash) return;
    await ctx.db.delete(id);
    if (squash.auto) {
      const cube = await ctx.db
        .query('cubes')
        .withIndex('by_cubeId', (q) => q.eq('cubeId', squash.cubeId))
        .unique();
      if (cube) {
        const noAuto = new Set(cube.noAutoSquash ?? []);
        for (const e of squash.entryIds) noAuto.add(e);
        await ctx.db.patch(cube._id, { noAutoSquash: [...noAuto] });
      }
    }
  },
});

export const removeAll = mutation({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    const all = await ctx.db
      .query('squashes')
      .withIndex('by_cube', (q) => q.eq('cubeId', cubeId))
      .collect();
    for (const s of all) await ctx.db.delete(s._id);
    const cube = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
      .unique();
    if (cube) await ctx.db.patch(cube._id, { noAutoSquash: [], autoSquash: false });
    return all.length;
  },
});

export async function runAutoSquash(ctx: MutationCtx, cubeId: string, windowMs?: number): Promise<number> {
  const cube = await ctx.db
    .query('cubes')
    .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
    .unique();
  if (!cube) return 0;
  const window = windowMs ?? cube.autoSquashWindowMs ?? DEFAULT_AUTO_WINDOW_MS;
  const entries = await ctx.db
    .query('entries')
    .withIndex('by_cube_date', (q) => q.eq('cubeId', cubeId))
    .collect();
  const squashes = await ctx.db
    .query('squashes')
    .withIndex('by_cube', (q) => q.eq('cubeId', cubeId))
    .collect();
  const plans = planAutoSquash(
    entries.map((e) => ({ id: e.changelogId, date: e.date, blogTitle: e.blog?.title })),
    squashes.map((s) => ({ id: s._id, entryIds: s.entryIds, auto: s.auto ?? false, title: s.title })),
    new Set(cube.noAutoSquash ?? []),
    window,
  );
  const byId = new Map(squashes.map((s) => [s._id as string, s]));
  for (const plan of plans) {
    for (const rid of plan.replaceIds) {
      const existing = byId.get(rid);
      if (existing) await ctx.db.delete(existing._id);
    }
    await ctx.db.insert('squashes', { cubeId, entryIds: plan.entryIds, title: plan.title, auto: true });
  }
  return plans.length;
}

export const autoSquash = mutation({
  args: { cubeId: v.string(), windowMs: v.optional(v.number()) },
  handler: async (ctx, { cubeId, windowMs }) => {
    const cube = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
      .unique();
    if (!cube) throw new Error('Cube not found');
    await ctx.db.patch(cube._id, {
      autoSquash: true,
      ...(windowMs !== undefined ? { autoSquashWindowMs: windowMs } : {}),
    });
    return await runAutoSquash(ctx, cubeId, windowMs);
  },
});
