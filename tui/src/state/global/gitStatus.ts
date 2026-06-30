import { atom } from 'jotai';
import { readGitStatusLabel } from '@libs/git/gitStatus.js';
import { workspaceCwdAtom } from '@state/global/workspace.js';

export const gitStatusLabelOverrideAtom = atom<string | undefined>(undefined);

export const gitStatusLabelAtom = atom((get) => {
  const override = get(gitStatusLabelOverrideAtom);
  return override ?? readGitStatusLabel(get(workspaceCwdAtom));
});
