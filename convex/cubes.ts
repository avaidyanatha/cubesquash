import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cubes = await ctx.db.query('cubes').collect();
    return cubes.sort((a, b) => b.lastSyncedAt - a.lastSyncedAt);
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const byShort = await ctx.db
      .query('cubes')
      .withIndex('by_shortId', (q) => q.eq('shortId', id.toLowerCase()))
      .unique();
    if (byShort) return byShort;
    return await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', id))
      .unique();
  },
});

export const updateSettings = mutation({
  args: {
    cubeId: v.string(),
    hideNonCardChanges: v.optional(v.boolean()),
    netOut: v.optional(v.boolean()),
    hideMaybeboard: v.optional(v.boolean()),
    autoSquash: v.optional(v.boolean()),
    autoSquashWindowMs: v.optional(v.number()),
  },
  handler: async (ctx, { cubeId, ...settings }) => {
    const cube = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
      .unique();
    if (!cube) throw new Error('Cube not found');
    const patch: Record<string, boolean | number> = {};
    if (settings.hideNonCardChanges !== undefined) patch.hideNonCardChanges = settings.hideNonCardChanges;
    if (settings.netOut !== undefined) patch.netOut = settings.netOut;
    if (settings.hideMaybeboard !== undefined) patch.hideMaybeboard = settings.hideMaybeboard;
    if (settings.autoSquash !== undefined) patch.autoSquash = settings.autoSquash;
    if (settings.autoSquashWindowMs !== undefined) patch.autoSquashWindowMs = settings.autoSquashWindowMs;
    await ctx.db.patch(cube._id, patch);
  },
});

export const remove = mutation({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    const cube = await ctx.db
      .query('cubes')
      .withIndex('by_cubeId', (q) => q.eq('cubeId', cubeId))
      .unique();
    if (cube) await ctx.db.delete(cube._id);
    const entries = await ctx.db
      .query('entries')
      .withIndex('by_cube_date', (q) => q.eq('cubeId', cubeId))
      .collect();
    for (const e of entries) await ctx.db.delete(e._id);
    const squashes = await ctx.db
      .query('squashes')
      .withIndex('by_cube', (q) => q.eq('cubeId', cubeId))
      .collect();
    for (const s of squashes) await ctx.db.delete(s._id);
  },
});
