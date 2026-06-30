import { atom } from 'jotai';
import { DEFAULT_COLUMNS, DEFAULT_ROWS, MIN_ROWS } from '@libs/tui/layout.ts';

// Test-only seams that pin a deterministic viewport ahead of the live terminal
// size; production never sets these, so columns/rows resolve to window ?? default.
export const columnsTestOverrideAtom = atom<number | undefined>(undefined);
export const rowsTestOverrideAtom = atom<number | undefined>(undefined);
export const windowColumnsAtom = atom<number | undefined>(undefined);
export const windowRowsAtom = atom<number | undefined>(undefined);

export const columnsAtom = atom(
  (get) => get(columnsTestOverrideAtom) ?? get(windowColumnsAtom) ?? DEFAULT_COLUMNS
);

export const rowsAtom = atom((get) =>
  Math.max(MIN_ROWS, get(rowsTestOverrideAtom) ?? get(windowRowsAtom) ?? DEFAULT_ROWS)
);
