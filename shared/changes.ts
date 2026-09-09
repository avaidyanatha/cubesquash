export type CompactCard = {
  cardID: string;
  tags?: string[];
  status?: string;
  finish?: string;
  colors?: string[];
  cmc?: number | string;
  type_line?: string;
  rarity?: string;
  colorCategory?: string;
  notes?: string;
};

export type CardPair = { from: CompactCard; to: CompactCard };

export type CompactBoard = {
  adds: CompactCard[];
  removes: CompactCard[];
  swaps: CardPair[];
  edits: CardPair[];
};

export type CompactChanges = Record<string, CompactBoard>;

export type Counts = { adds: number; removes: number; swaps: number; edits: number };

const STRING_FIELDS = ['status', 'finish', 'type_line', 'rarity', 'colorCategory', 'notes'] as const;

const compactCard = (raw: unknown): CompactCard | null => {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.cardID !== 'string') return null;
  const out: CompactCard = { cardID: c.cardID };
  if (Array.isArray(c.tags)) {
    const tags = c.tags.filter((t): t is string => typeof t === 'string');
    if (tags.length) out.tags = tags;
  }
  if (Array.isArray(c.colors)) {
    out.colors = c.colors.filter((t): t is string => typeof t === 'string');
  }
  if (typeof c.cmc === 'number' || typeof c.cmc === 'string') out.cmc = c.cmc;
  for (const f of STRING_FIELDS) {
    if (typeof c[f] === 'string' && (c[f] as string).length) out[f] = c[f] as string;
  }
  return out;
};

export const emptyBoard = (): CompactBoard => ({ adds: [], removes: [], swaps: [], edits: [] });

export const isBoardEmpty = (b: CompactBoard): boolean =>
  b.adds.length === 0 && b.removes.length === 0 && b.swaps.length === 0 && b.edits.length === 0;

export function compactChanges(raw: unknown): CompactChanges {
  const out: CompactChanges = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [board, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const b = value as Record<string, unknown[]>;
    const cb = emptyBoard();
    for (const a of b.adds ?? []) {
      const c = compactCard(a);
      if (c) cb.adds.push(c);
    }
    for (const r of b.removes ?? []) {
      const c = compactCard((r as Record<string, unknown>)?.oldCard);
      if (c) cb.removes.push(c);
    }
    for (const s of b.swaps ?? []) {
      const rec = s as Record<string, unknown>;
      const from = compactCard(rec?.oldCard);
      const to = compactCard(rec?.card);
      if (from && to) cb.swaps.push({ from, to });
    }
    for (const e of b.edits ?? []) {
      const rec = e as Record<string, unknown>;
      const from = compactCard(rec?.oldCard);
      const to = compactCard(rec?.newCard);
      if (from && to) cb.edits.push({ from, to });
    }
    if (!isBoardEmpty(cb)) out[board] = cb;
  }
  return out;
}

export function countChanges(changes: CompactChanges): Counts {
  const counts: Counts = { adds: 0, removes: 0, swaps: 0, edits: 0 };
  for (const b of Object.values(changes)) {
    counts.adds += b.adds.length;
    counts.removes += b.removes.length;
    counts.swaps += b.swaps.length;
    counts.edits += b.edits.length;
  }
  return counts;
}

export function cardIdsIn(changes: CompactChanges): string[] {
  const set = new Set<string>();
  for (const b of Object.values(changes)) {
    for (const c of b.adds) set.add(c.cardID);
    for (const c of b.removes) set.add(c.cardID);
    for (const p of b.swaps) {
      set.add(p.from.cardID);
      set.add(p.to.cardID);
    }
    for (const p of b.edits) {
      set.add(p.from.cardID);
      set.add(p.to.cardID);
    }
  }
  return [...set];
}
