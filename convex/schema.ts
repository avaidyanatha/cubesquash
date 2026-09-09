import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  cubes: defineTable({
    cubeId: v.string(),
    shortId: v.string(),
    name: v.string(),
    imageUri: v.optional(v.string()),
    imageArtist: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    cardCount: v.optional(v.number()),
    lastSyncedAt: v.number(),
    entryCount: v.number(),
    fullySynced: v.boolean(),
    hideNonCardChanges: v.boolean(),
    netOut: v.boolean(),
    hideMaybeboard: v.optional(v.boolean()),
    autoSquash: v.optional(v.boolean()),
    autoSquashWindowMs: v.optional(v.number()),
    noAutoSquash: v.optional(v.array(v.string())),
  })
    .index('by_shortId', ['shortId'])
    .index('by_cubeId', ['cubeId']),

  entries: defineTable({
    cubeId: v.string(),
    changelogId: v.string(),
    date: v.number(),
    cubeVersion: v.optional(v.number()),
    changes: v.any(),
    counts: v.object({ adds: v.number(), removes: v.number(), swaps: v.number(), edits: v.number() }),
    blog: v.optional(v.object({ id: v.string(), title: v.string(), body: v.string(), date: v.number() })),
  })
    .index('by_cube_date', ['cubeId', 'date'])
    .index('by_changelogId', ['changelogId']),

  cards: defineTable({
    cardID: v.string(),
    name: v.string(),
    imageSmall: v.optional(v.string()),
    imageNormal: v.optional(v.string()),
    colorCategory: v.optional(v.string()),
    cmc: v.optional(v.number()),
    type: v.optional(v.string()),
    set: v.optional(v.string()),
  }).index('by_cardID', ['cardID']),

  squashes: defineTable({
    cubeId: v.string(),
    entryIds: v.array(v.string()),
    title: v.optional(v.string()),
    auto: v.optional(v.boolean()),
  }).index('by_cube', ['cubeId']),
});
