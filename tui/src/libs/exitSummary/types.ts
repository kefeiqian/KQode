import type { GitLineDelta } from '@libs/git/lineDelta.ts';

/** Foreground colorizer seam — real ANSI in production, identity in tests. */
export type Colorize = (text: string, hex: string) => string;

/**
 * Values the exit summary card renders. `changes` and `durationMs` are
 * `undefined` when unavailable (rendered as placeholders); Cost, Tokens, and
 * Resume are always placeholders in this slice.
 */
export type ExitSummaryData = {
  changes: GitLineDelta | undefined;
  durationMs: number | undefined;
};
