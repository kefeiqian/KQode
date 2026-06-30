import { atom } from 'jotai';
import { statusHintAtom } from '@state/global/statusHint.js';

export const inputLockedAtom = atom((get) => get(statusHintAtom) !== undefined);
