import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

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
    return await ctx.db.insert('squashes', { cubeId, entryIds, title });
  },
});

export const createMany = mutation({
  args: { cubeId: v.string(), groups: v.array(v.array(v.string())) },
  handler: async (ctx, { cubeId, groups }) => {
    let created = 0;
    for (const entryIds of groups) {
      if (entryIds.length < 2) continue;
      await ctx.db.insert('squashes', { cubeId, entryIds });
      created++;
    }
    return created;
  },
});

export const rename = mutation({
  args: { id: v.id('squashes'), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const trimmed = title.trim();
    await ctx.db.patch(id, { title: trimmed.length ? trimmed : undefined });
  },
});

export const remove = mutation({
  args: { id: v.id('squashes') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
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
    return all.length;
  },
});
