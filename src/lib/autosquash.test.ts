import { describe, expect, it } from 'vitest';

import { planAutoSquash } from '../../shared/autosquash';

const H = 60 * 60 * 1000;
const DAY = 24 * H;
const e = (id: string, hoursAgo: number, blogTitle?: string) => ({ id, date: 1_000 * DAY - hoursAgo * H, blogTitle });

describe('planAutoSquash', () => {
  it('groups a run of nearby entries and leaves distant ones alone', () => {
    const plans = planAutoSquash([e('a', 0), e('b', 2), e('c', 5), e('d', 100)], [], new Set(), DAY);
    expect(plans).toEqual([{ entryIds: ['a', 'b', 'c'], title: undefined, replaceIds: [] }]);
  });

  it('titles the group after the one blog post in the run', () => {
    const plans = planAutoSquash([e('a', 0), e('b', 2, 'Big update'), e('c', 5)], [], new Set(), DAY);
    expect(plans[0].title).toBe('Big update');
    expect(plans[0].entryIds).toEqual(['a', 'b', 'c']);
  });

  it('splits a run between two blog posts by nearest anchor', () => {
    const plans = planAutoSquash(
      [e('a', 0), e('p1', 1, 'First'), e('b', 3), e('c', 9), e('p2', 10, 'Second'), e('d', 12)],
      [],
      new Set(),
      DAY,
    );
    expect(plans.map((p) => [p.title, p.entryIds])).toEqual([
      ['First', ['a', 'p1', 'b']],
      ['Second', ['c', 'p2', 'd']],
    ]);
  });

  it('never merges across a manual squash', () => {
    const plans = planAutoSquash(
      [e('a', 0), e('b', 1), e('c', 2), e('d', 3)],
      [{ id: 's1', entryIds: ['b', 'c'], auto: false }],
      new Set(),
      DAY,
    );
    expect(plans).toEqual([]);
  });

  it('extends an existing auto squash with a new neighbour and replaces it', () => {
    const plans = planAutoSquash(
      [e('new', 0), e('b', 1), e('c', 2)],
      [{ id: 's1', entryIds: ['b', 'c'], auto: true, title: 'Older' }],
      new Set(),
      DAY,
    );
    expect(plans).toEqual([{ entryIds: ['new', 'b', 'c'], title: 'Older', replaceIds: ['s1'] }]);
  });

  it('does nothing when an auto squash already covers the run', () => {
    const plans = planAutoSquash(
      [e('b', 1), e('c', 2)],
      [{ id: 's1', entryIds: ['b', 'c'], auto: true }],
      new Set(),
      DAY,
    );
    expect(plans).toEqual([]);
  });

  it('respects entries the user unsquashed', () => {
    const plans = planAutoSquash([e('a', 0), e('b', 1), e('c', 2)], [], new Set(['b']), DAY);
    expect(plans).toEqual([]);
  });
});
