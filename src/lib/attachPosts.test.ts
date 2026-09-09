import { describe, expect, it } from 'vitest';

import { attachUnlinkedPosts } from '../../shared/attachPosts';

const H = 60 * 60 * 1000;
const T = 1_000 * 24 * H;

describe('attachUnlinkedPosts', () => {
  it('attaches an unlinked post to the nearest entry within a day', () => {
    const map = attachUnlinkedPosts(
      [
        { changelogId: 'a', date: T - 5 * H },
        { changelogId: 'b', date: T - 1 * H },
        { changelogId: 'c', date: T - 40 * H },
      ],
      [{ date: T }],
    );
    expect([...map.entries()]).toEqual([['b', 0]]);
  });

  it('ignores posts that already have a changelist and entries that already have a post', () => {
    const map = attachUnlinkedPosts(
      [
        { changelogId: 'a', date: T, blog: { id: 'x' } },
        { changelogId: 'b', date: T - 2 * H },
      ],
      [{ date: T, changelist: 'a' }, { date: T - 1 * H }],
    );
    expect([...map.entries()]).toEqual([['b', 1]]);
  });

  it('uses each post and each entry at most once, closest pairs first', () => {
    const map = attachUnlinkedPosts(
      [
        { changelogId: 'a', date: T },
        { changelogId: 'b', date: T - 3 * H },
      ],
      [{ date: T - 1 * H }, { date: T - 2 * H }],
    );
    expect(map.get('a')).toBe(0);
    expect(map.get('b')).toBe(1);
  });

  it('leaves a post alone when nothing is within the window', () => {
    expect(attachUnlinkedPosts([{ changelogId: 'a', date: T - 30 * H }], [{ date: T }]).size).toBe(0);
  });
});
