import { describe, expect, it } from 'vitest';
import { emblemLines } from '@libs/exitSummary/emblem.ts';

describe('emblemLines', () => {
  it('returns the full multi-row emblem including the wordmark at wide widths', () => {
    const lines = emblemLines(80);

    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.length).toBeLessThanOrEqual(4);
    expect(lines).toContain('KQode');
  });

  it('degrades to a single-line wordmark below the compact threshold', () => {
    expect(emblemLines(48)).toEqual(['KQode']);
  });

  it('is omitted below the hide threshold so rows can reflow left', () => {
    expect(emblemLines(30)).toEqual([]);
  });
});
