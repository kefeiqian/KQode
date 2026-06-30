import { atom } from 'jotai';
import { statusHintAtom } from '@state/global/statusHint.js';

export const inputLockedOverrideAtom = atom(false);

export const inputLockedAtom = atom((get) => {
  const override = get(inputLockedOverrideAtom);
  return override || get(statusHintAtom) !== undefined;
});
