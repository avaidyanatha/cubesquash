import { describe, expect, it } from 'vitest';

import { blogTitleOf, isAutomaticPost } from '../../shared/blog';

describe('isAutomaticPost', () => {
  it('matches Cube Cobra placeholder titles with no body', () => {
    expect(isAutomaticPost({ title: 'Cube Updated – Automatic Post', body: '' })).toBe(true);
    expect(isAutomaticPost({ title: 'Cube Updated - Automatic Post', body: '  ' })).toBe(true);
    expect(isAutomaticPost({ title: 'Cube Bulk Import - Automatic Post', body: '' })).toBe(true);
  });

  it('keeps a placeholder-titled post that has a written body', () => {
    expect(isAutomaticPost({ title: 'Cube Updated – Automatic Post', body: 'Swapped the removal suite.' })).toBe(false);
    expect(blogTitleOf({ title: 'Cube Updated – Automatic Post', body: 'x' })).toBe('Cube Updated – Automatic Post');
  });

  it('returns undefined titles for automatic posts', () => {
    expect(blogTitleOf({ title: 'Cube Updated – Automatic Post', body: '' })).toBeUndefined();
    expect(blogTitleOf({ title: 'Big update', body: '' })).toBe('Big update');
  });
});
