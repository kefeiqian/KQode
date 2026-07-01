import { emblemLines } from '@libs/exitSummary/emblem.ts';
import { formatDuration } from '@libs/exitSummary/formatDuration.ts';
import type { Colorize, ExitSummaryData } from '@libs/exitSummary/types.ts';
import { theme } from '@theme/themeConfig.ts';

const PLACEHOLDER_MARKER = '—';
const INSERTIONS_SIGN = '+';
const DELETIONS_SIGN = '−';
const COLUMN_GAP = '  ';
const ROW_LABELS = ['Changes', 'Duration', 'Cost', 'Tokens', 'Resume'] as const;
const LABEL_WIDTH = Math.max(...ROW_LABELS.map((label) => label.length));

type RowLabel = (typeof ROW_LABELS)[number];

export type FormatExitSummaryCardOptions = {
  colorize: Colorize;
  columns: number;
};

/**
 * Renders the exit summary card as a plain multi-line string: the KQode emblem
 * on the left and the labeled stat rows on the right.
 *
 * Only the `+`/`−` Changes counts and the placeholder marker are colorized so
 * the card stays legible on the user's restored (possibly light) terminal
 * background. `colorize` is injected — pass an identity function to assert plain
 * structure in tests.
 */
export function formatExitSummaryCard(
  data: ExitSummaryData,
  { colorize, columns }: FormatExitSummaryCardOptions
): string {
  const rows = ROW_LABELS.map((label) => renderRow(label, data, colorize));
  return composeColumns(emblemLines(columns), rows).join('\n');
}

function renderRow(label: RowLabel, data: ExitSummaryData, colorize: Colorize): string {
  return `${label.padEnd(LABEL_WIDTH)}${COLUMN_GAP}${renderValue(label, data, colorize)}`;
}

function renderValue(label: RowLabel, data: ExitSummaryData, colorize: Colorize): string {
  if (label === 'Changes') {
    if (data.changes === undefined) {
      return placeholder(colorize);
    }
    const added = colorize(`${INSERTIONS_SIGN}${data.changes.insertions}`, theme.colors.accentGreen);
    const removed = colorize(`${DELETIONS_SIGN}${data.changes.deletions}`, theme.colors.errorRed);
    return `${added} ${removed}`;
  }

  if (label === 'Duration') {
    return data.durationMs === undefined ? placeholder(colorize) : formatDuration(data.durationMs);
  }

  return placeholder(colorize);
}

function placeholder(colorize: Colorize): string {
  return colorize(PLACEHOLDER_MARKER, theme.colors.muted);
}

function composeColumns(emblem: readonly string[], rows: readonly string[]): string[] {
  if (emblem.length === 0) {
    return [...rows];
  }

  const emblemWidth = Math.max(...emblem.map((line) => line.length));
  const height = Math.max(emblem.length, rows.length);
  const lines: string[] = [];
  for (let index = 0; index < height; index += 1) {
    const left = (emblem[index] ?? '').padEnd(emblemWidth);
    const right = rows[index] ?? '';
    lines.push(`${left}${COLUMN_GAP}${right}`.replace(/\s+$/, ''));
  }

  return lines;
}
