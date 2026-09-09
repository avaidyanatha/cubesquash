import { v } from 'convex/values';

import { query } from './_generated/server';

export const byCube = query({
  args: { cubeId: v.string() },
  handler: async (ctx, { cubeId }) => {
    const entries = await ctx.db
      .query('entries')
      .withIndex('by_cube_date', (q) => q.eq('cubeId', cubeId))
      .order('desc')
      .collect();
    return entries.map((e) => ({
      changelogId: e.changelogId,
      date: e.date,
      cubeVersion: e.cubeVersion,
      changes: e.changes,
      counts: e.counts,
      blog: e.blog,
    }));
  },
});
