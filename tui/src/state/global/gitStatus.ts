import { atom } from 'jotai';
import { readGitStatusLabel } from '@libs/git/gitStatus.js';
import { workspaceCwdAtom } from '@state/global/workspace.js';

// Test-only seam to pin a deterministic label; production reads real git status.
export const gitStatusLabelTestOverrideAtom = atom<string | undefined>(undefined);

export const gitStatusLabelAtom = atom((get) => {
  const override = get(gitStatusLabelTestOverrideAtom);
  return override ?? readGitStatusLabel(get(workspaceCwdAtom));
});
