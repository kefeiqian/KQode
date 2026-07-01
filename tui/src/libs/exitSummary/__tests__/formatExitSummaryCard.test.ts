import { describe, expect, it } from 'vitest';
import { formatExitSummaryCard } from '@libs/exitSummary/formatExitSummaryCard.ts';
import type { Colorize } from '@libs/exitSummary/types.ts';

const identity: Colorize = (text) => text;

function countMarker(card: string, marker: string): number {
  return (card.match(new RegExp(marker, 'g')) ?? []).length;
}

describe('formatExitSummaryCard', () => {
  it('renders a bordered banner card with the five rows in order (covers R2, R3, R10)', () => {
    const card = formatExitSummaryCard(
      { changes: { insertions: 12, deletions: 4 }, durationMs: 125_000 },
      { colorize: identity, columns: 80 }
    );

    // Rounded border + block banner on top of the stat rows.
    expect(card).toContain('╭');
    expect(card).toContain('╯');
    expect(card).toContain('█');
    expect(card).toContain('+12 −4');
    expect(card).toContain('2m 5s');
    // Cost, Tokens, Resume are placeholders (Changes + Duration are real).
    expect(countMarker(card, '—')).toBe(3);

    const order = ['Changes', 'Duration', 'Cost', 'Tokens', 'Resume'].map((label) =>
      card.indexOf(label)
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('renders Changes as a placeholder when unavailable, e.g. non-repo (covers AE3)', () => {
    const card = formatExitSummaryCard(
      { changes: undefined, durationMs: 1_000 },
      { colorize: identity, columns: 80 }
    );

    // Changes + Cost + Tokens + Resume are placeholders; Duration is real.
    expect(countMarker(card, '—')).toBe(4);
  });

  it('degrades to a single-line wordmark box when the banner will not fit (covers R11)', () => {
    const card = formatExitSummaryCard(
      { changes: { insertions: 0, deletions: 0 }, durationMs: 1_000 },
      { colorize: identity, columns: 30 }
    );

    expect(card).toContain('╭');
    expect(card).toContain('KQode');
    expect(card).not.toContain('█');
  });

  it('drops the border and stacks rows plainly on a very narrow terminal (covers R11)', () => {
    const card = formatExitSummaryCard(
      { changes: { insertions: 0, deletions: 0 }, durationMs: 0 },
      { colorize: identity, columns: 15 }
    );
    const lines = card.split('\n');

    expect(card).not.toContain('╭');
    expect(lines).toHaveLength(5);
    expect(lines[0].startsWith('Changes')).toBe(true);
    expect(card).toContain('+0 −0');
  });

  it('leaves text uncolored under the identity seam so it stays background-agnostic', () => {
    const card = formatExitSummaryCard(
      { changes: { insertions: 1, deletions: 1 }, durationMs: 1_000 },
      { colorize: identity, columns: 80 }
    );

    expect(card).not.toContain('\u001B[');
  });
});
