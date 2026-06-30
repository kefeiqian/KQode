import { atom } from 'jotai';
import { DEFAULT_COLUMNS, DEFAULT_ROWS, MIN_ROWS } from '@libs/tui/layout.js';

export const columnsOverrideAtom = atom<number | undefined>(undefined);
export const rowsOverrideAtom = atom<number | undefined>(undefined);
export const windowColumnsAtom = atom<number | undefined>(undefined);
export const windowRowsAtom = atom<number | undefined>(undefined);

export const columnsAtom = atom(
  (get) => get(columnsOverrideAtom) ?? get(windowColumnsAtom) ?? DEFAULT_COLUMNS
);

export const rowsAtom = atom((get) =>
  Math.max(MIN_ROWS, get(rowsOverrideAtom) ?? get(windowRowsAtom) ?? DEFAULT_ROWS)
);
