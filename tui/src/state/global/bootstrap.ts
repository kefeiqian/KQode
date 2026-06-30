import type { createStore } from 'jotai';
import type { BackendClient } from '@backend/client/backendClient.js';
import type { BodyEntry } from '@libs/tui/bodyRows.js';
import { bodyEntriesAtom } from '@state/global/body.js';
import {
  columnsOverrideAtom,
  rowsOverrideAtom,
  windowColumnsAtom,
  windowRowsAtom
} from '@state/global/dimensions.js';
import { gitStatusLabelOverrideAtom } from '@state/global/gitStatus.js';
import { inputLockedOverrideAtom } from '@state/global/inputLock.js';
import { DEFAULT_MODEL_LABEL, modelLabelAtom } from '@state/global/model.js';
import { backendClientAtom } from '@state/global/backend.js';
import { statusHintOverrideAtom } from '@state/global/statusHint.js';
import type { StatusHint } from '@state/global/statusHint.js';
import { productVersionAtom, repoRootAtom, workspaceCwdAtom } from '@state/global/workspace.js';

export type HomeScreenOptions = {
  productVersion: string;
  workspaceCwd: string;
  gitStatusLabel?: string;
  modelLabel?: string;
  statusHint?: StatusHint;
  bodyEntries?: readonly BodyEntry[];
  columns?: number;
  rows?: number;
  inputLocked?: boolean;
};

export type AppBootstrapState = HomeScreenOptions & {
  repoRoot?: string;
  backendClient?: BackendClient;
};

export function seedScreenState(
  store: ReturnType<typeof createStore>,
  screen: AppBootstrapState,
  options?: {
    windowColumns?: number;
    windowRows?: number;
  }
): void {
  store.set(repoRootAtom, screen.repoRoot);
  store.set(productVersionAtom, screen.productVersion);
  store.set(workspaceCwdAtom, screen.workspaceCwd);
  store.set(gitStatusLabelOverrideAtom, screen.gitStatusLabel);
  store.set(modelLabelAtom, screen.modelLabel ?? DEFAULT_MODEL_LABEL);
  store.set(statusHintOverrideAtom, screen.statusHint);
  store.set(bodyEntriesAtom, screen.bodyEntries);
  store.set(columnsOverrideAtom, screen.columns);
  store.set(rowsOverrideAtom, screen.rows);
  store.set(windowColumnsAtom, options?.windowColumns);
  store.set(windowRowsAtom, options?.windowRows);
  store.set(inputLockedOverrideAtom, screen.inputLocked ?? false);
  store.set(backendClientAtom, screen.backendClient);
}
