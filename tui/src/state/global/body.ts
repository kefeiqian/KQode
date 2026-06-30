import { atom } from 'jotai';
import type { BodyEntry } from '@libs/tui/bodyRows.js';

export const bodyEntriesAtom = atom<readonly BodyEntry[] | undefined>(undefined);
