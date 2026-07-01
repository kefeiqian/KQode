import { bannerLines } from '@libs/exitSummary/banner.ts';
import { boxed } from '@libs/exitSummary/border.ts';
import { formatDuration } from '@libs/exitSummary/formatDuration.ts';
import type { Colorize, ExitSummaryData } from '@libs/exitSummary/types.ts';
import { PRODUCT_NAME } from '@libs/product/productMetadata.ts';
import { visibleLength } from '@libs/terminal/ansiColor.ts';
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
 * Renders the exit summary card as a plain multi-line string: the KQode wordmark
 * banner on top and the labeled stat rows below, wrapped in a rounded border.
 *
 * The card degrades to fit `columns`: the full block banner, then a single-line
 * wordmark, then borderless stacked rows on very narrow terminals. Only the
 * `+`/`−` Changes counts and the placeholder marker are colorized so the card
 * stays legible on the user's restored (possibly light) terminal background.
 * `colorize` is injected — pass an identity function to assert plain structure.
 */
export function formatExitSummaryCard(
  data: ExitSummaryData,
  { colorize, columns }: FormatExitSummaryCardOptions
): string {
  const rows = ROW_LABELS.map((label) => renderRow(label, data, colorize));
  return renderCard(rows, columns).join('\n');
}

function renderCard(rows: readonly string[], columns: number): string[] {
  for (const header of [bannerLines(), [PRODUCT_NAME]]) {
    const card = boxed([...header, '', ...rows], { width: visibleLength });
    if (cardWidth(card) <= columns) {
      return card;
    }
  }

  // Too narrow for a bordered card — stack the rows plainly.
  return [...rows];
}

function cardWidth(lines: readonly string[]): number {
  return lines.reduce((max, line) => Math.max(max, visibleLength(line)), 0);
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
