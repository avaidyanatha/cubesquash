import { describe, expect, it } from 'vitest';

import { type CompactChanges } from '../../shared/changes';
import { diffCards, mergeChanges } from './merge';

const card = (id: string, extra: Record<string, unknown> = {}) => ({ cardID: id, ...extra });

const entry = (board: Partial<CompactChanges['mainboard']>): CompactChanges => ({
  mainboard: { adds: [], removes: [], swaps: [], edits: [], ...board },
});

describe('mergeChanges', () => {
  it('concatenates without netting when netOut is off', () => {
    const merged = mergeChanges(
      [entry({ adds: [card('a')] }), entry({ removes: [card('a')] })],
      { netOut: false, hideEdits: false },
    );
    expect(merged.mainboard.adds).toHaveLength(1);
    expect(merged.mainboard.removes).toHaveLength(1);
  });

  it('cancels an add followed by a remove when netting', () => {
    const merged = mergeChanges(
      [entry({ adds: [card('a'), card('b')] }), entry({ removes: [card('a')] })],
      { netOut: true, hideEdits: false },
    );
    expect(merged.mainboard.adds.map((c) => c.cardID)).toEqual(['b']);
    expect(merged.mainboard.removes).toHaveLength(0);
  });

  it('cancels a remove followed by a re-add when netting', () => {
    const merged = mergeChanges(
      [entry({ removes: [card('a')] }), entry({ adds: [card('a')] })],
      { netOut: true, hideEdits: false },
    );
    expect(merged).toEqual({});
  });

  it('expands swaps into add and remove when netting', () => {
    const merged = mergeChanges([entry({ swaps: [{ from: card('old'), to: card('new') }] })], {
      netOut: true,
      hideEdits: false,
    });
    expect(merged.mainboard.adds.map((c) => c.cardID)).toEqual(['new']);
    expect(merged.mainboard.removes.map((c) => c.cardID)).toEqual(['old']);
  });

  it('folds an edit into an add made in the same group', () => {
    const merged = mergeChanges(
      [
        entry({ adds: [card('a', { tags: ['x'] })] }),
        entry({ edits: [{ from: card('a', { tags: ['x'] }), to: card('a', { tags: ['y'] }) }] }),
      ],
      { netOut: true, hideEdits: false },
    );
    expect(merged.mainboard.adds).toEqual([card('a', { tags: ['y'] })]);
    expect(merged.mainboard.edits).toHaveLength(0);
  });

  it('chains edits and drops a round trip', () => {
    const merged = mergeChanges(
      [
        entry({ edits: [{ from: card('a', { status: 'Owned' }), to: card('a', { status: 'Proxied' }) }] }),
        entry({ edits: [{ from: card('a', { status: 'Proxied' }), to: card('a', { status: 'Owned' }) }] }),
      ],
      { netOut: true, hideEdits: false },
    );
    expect(merged).toEqual({});
  });

  it('hides edits entirely when hideEdits is on', () => {
    const merged = mergeChanges(
      [entry({ adds: [card('a')], edits: [{ from: card('b'), to: card('b', { status: 'Proxied' }) }] })],
      { netOut: false, hideEdits: true },
    );
    expect(merged.mainboard.edits).toHaveLength(0);
    expect(merged.mainboard.adds).toHaveLength(1);
  });

  it('orders mainboard before maybeboard', () => {
    const merged = mergeChanges(
      [{ maybeboard: { adds: [card('m')], removes: [], swaps: [], edits: [] } }, entry({ adds: [card('a')] })],
      { netOut: false, hideEdits: false },
    );
    expect(Object.keys(merged)).toEqual(['mainboard', 'maybeboard']);
  });
});

describe('diffCards', () => {
  it('reports a printing change and tag change', () => {
    const diffs = diffCards(card('a', { tags: ['x'] }), card('b', { tags: ['x', 'y'] }));
    expect(diffs.map((d) => d.field)).toEqual(['printing', 'tags']);
  });
});
