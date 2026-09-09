import { v } from 'convex/values';

import { query } from './_generated/server';

export const getMany = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const out: Array<{
      cardID: string;
      name: string;
      imageSmall?: string;
      imageNormal?: string;
      colorCategory?: string;
      cmc?: number;
      type?: string;
    }> = [];
    for (const id of ids) {
      const card = await ctx.db
        .query('cards')
        .withIndex('by_cardID', (q) => q.eq('cardID', id))
        .unique();
      if (card) {
        out.push({
          cardID: card.cardID,
          name: card.name,
          imageSmall: card.imageSmall,
          imageNormal: card.imageNormal,
          colorCategory: card.colorCategory,
          cmc: card.cmc,
          type: card.type,
        });
      }
    }
    return out;
  },
});
