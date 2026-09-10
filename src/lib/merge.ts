import {
  type CardPair,
  type CompactBoard,
  type CompactCard,
  type CompactChanges,
  emptyBoard,
  isBoardEmpty,
} from '../../shared/changes';

export type MergeOptions = { netOut: boolean; hideEdits: boolean };

const sameCard = (a: CompactCard, b: CompactCard): boolean => JSON.stringify(a) === JSON.stringify(b);

function mergeBoardConcat(boards: CompactBoard[], hideEdits: boolean): CompactBoard {
  const out = emptyBoard();
  for (const b of boards) {
    out.adds.push(...b.adds);
    out.removes.push(...b.removes);
    out.swaps.push(...b.swaps);
    if (!hideEdits) out.edits.push(...b.edits);
  }
  return out;
}

function mergeBoardNet(boards: CompactBoard[], hideEdits: boolean): CompactBoard {
  const added = new Map<string, CompactCard>();
  const removed = new Map<string, CompactCard>();
  const edits = new Map<string, CardPair>();

  const add = (c: CompactCard) => {
    if (removed.has(c.cardID)) {
      removed.delete(c.cardID);
      return;
    }
    added.set(c.cardID, c);
  };
  const remove = (c: CompactCard) => {
    if (added.has(c.cardID)) {
      added.delete(c.cardID);
      return;
    }
    if (edits.has(c.cardID)) edits.delete(c.cardID);
    removed.set(c.cardID, c);
  };
  const edit = (pair: CardPair) => {
    if (added.has(pair.from.cardID)) {
      added.delete(pair.from.cardID);
      added.set(pair.to.cardID, pair.to);
      return;
    }
    const prior = edits.get(pair.from.cardID);
    const from = prior ? prior.from : pair.from;
    edits.delete(pair.from.cardID);
    if (!sameCard(from, pair.to)) edits.set(pair.to.cardID, { from, to: pair.to });
  };

  const swapPairs: CardPair[] = [];
  for (const b of boards) {
    for (const p of b.swaps) {
      remove(p.from);
      add(p.to);
      swapPairs.push(p);
    }
    for (const c of b.removes) remove(c);
    for (const c of b.adds) add(c);
    for (const p of b.edits) edit(p);
  }

  // A swap whose both sides survived netting is still a swap; keep the arrow.
  const swaps: CardPair[] = [];
  for (const p of swapPairs) {
    const from = removed.get(p.from.cardID);
    const to = added.get(p.to.cardID);
    if (from && to) {
      removed.delete(p.from.cardID);
      added.delete(p.to.cardID);
      swaps.push({ from, to });
    }
  }

  return {
    adds: [...added.values()],
    removes: [...removed.values()],
    swaps,
    edits: hideEdits ? [] : [...edits.values()],
  };
}

export function mergeChanges(list: CompactChanges[], opts: MergeOptions): CompactChanges {
  const boardNames = new Set<string>();
  for (const c of list) for (const b of Object.keys(c)) boardNames.add(b);
  const out: CompactChanges = {};
  for (const board of [...boardNames].sort(boardOrder)) {
    const boards = list.map((c) => c[board]).filter((b): b is CompactBoard => !!b);
    const merged = opts.netOut ? mergeBoardNet(boards, opts.hideEdits) : mergeBoardConcat(boards, opts.hideEdits);
    if (!isBoardEmpty(merged)) out[board] = merged;
  }
  return out;
}

export function applyView(changes: CompactChanges, opts: MergeOptions): CompactChanges {
  return mergeChanges([changes], opts);
}

const BOARD_RANK: Record<string, number> = { mainboard: 0, maybeboard: 1, basics: 2 };
export function boardOrder(a: string, b: string): number {
  const ra = BOARD_RANK[a] ?? 10;
  const rb = BOARD_RANK[b] ?? 10;
  return ra === rb ? a.localeCompare(b) : ra - rb;
}

export type FieldDiff = { field: string; from: string; to: string };

const show = (v: unknown): string => {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
};

export function diffCards(from: CompactCard, to: CompactCard): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const fields: Array<keyof CompactCard> = [
    'cardID',
    'tags',
    'status',
    'finish',
    'colors',
    'cmc',
    'type_line',
    'rarity',
    'colorCategory',
    'notes',
  ];
  for (const f of fields) {
    const a = show(from[f]);
    const b = show(to[f]);
    if (a !== b) diffs.push({ field: f === 'cardID' ? 'printing' : f === 'type_line' ? 'type' : f, from: a, to: b });
  }
  return diffs;
}
