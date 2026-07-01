import { COMPACT_HEADER_BELOW_COLUMNS, HIDE_HEADER_BELOW_COLUMNS } from '@libs/tui/layout.ts';
import { PRODUCT_NAME } from '@libs/product/productMetadata.ts';

// Directional KQode mark (swappable): a compact block monogram above the
// wordmark. The engineering contract — width-based degradation, reusability,
// and legibility — matters more than the exact glyphs.
const FULL_EMBLEM: readonly string[] = ['▟█▙', '▜█▛', PRODUCT_NAME];

/**
 * Emblem lines for the given terminal width, degrading like the header
 * (`@libs/tui/layout.ts`): the full mark at wide widths, a single-line wordmark
 * below the compact threshold, and nothing below the hide threshold — where the
 * stat rows then reclaim the left column.
 */
export function emblemLines(columns: number): readonly string[] {
  if (columns < HIDE_HEADER_BELOW_COLUMNS) {
    return [];
  }

  if (columns < COMPACT_HEADER_BELOW_COLUMNS) {
    return [PRODUCT_NAME];
  }

  return FULL_EMBLEM;
}
