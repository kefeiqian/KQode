import { atom } from 'jotai';
import { readGitStatusLabel } from '@libs/git/gitStatus.ts';
import { workspaceCwdAtom } from '@state/global/workspace.ts';

// Test-only seam to pin a deterministic label; production reads real git status.
export const gitStatusLabelTestOverrideAtom = atom<string | undefined>(undefined);

export const gitStatusLabelAtom = atom((get) => {
  const override = get(gitStatusLabelTestOverrideAtom);
  return override ?? readGitStatusLabel(get(workspaceCwdAtom));
});
