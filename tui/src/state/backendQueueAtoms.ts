import { atom } from 'jotai';
import type { Getter, Setter } from 'jotai';
import { BackendClientError } from '@libs/backend/backendClient.js';
import { sanitizeDisplayText } from '@libs/text/sanitizeDisplayText.js';
import type { BodyEntry } from '@libs/tui/bodyRows.js';
import {
  bodyScrollOffsetRowsAtom,
  homeScreenConfigAtom,
  submittedPromptEntriesAtom
} from '@state/homeScreenAtoms.js';

type QueueItemState = 'active' | 'queued' | 'settled';

type BackendResult = { kind: 'success' | 'error'; text: string };

type QueueItem = {
  id: number;
  text: string;
  state: QueueItemState;
  result?: BackendResult;
};

let nextQueueItemId = 0;

/** Ordered record of submitted prompts and their backend outcomes. */
export const promptQueueAtom = atom<QueueItem[]>([]);

const drainingAtom = atom(false);

/**
 * Appends a submitted prompt and drains the backend queue one request at a time.
 *
 * The prompt is shown immediately: the first item is active with no marker and
 * later items render `(pending)` until they become active. Raw text is sent to
 * the backend while only sanitized text reaches the body, and validation/queue
 * state stays in memory for this slice.
 */
export const enqueuePromptAtom = atom(null, async (get, set, rawText: string) => {
  const hasActive = get(promptQueueAtom).some((item) => item.state === 'active');
  const item: QueueItem = {
    id: nextQueueItemId++,
    text: rawText,
    state: hasActive ? 'queued' : 'active'
  };

  set(promptQueueAtom, (queue) => [...queue, item]);
  set(bodyScrollOffsetRowsAtom, 0);
  syncBodyEntries(get, set);
  await drainQueue(get, set);
});

async function drainQueue(get: Getter, set: Setter): Promise<void> {
  if (get(drainingAtom)) {
    return;
  }

  set(drainingAtom, true);
  try {
    let active = findActive(get);
    while (active !== undefined) {
      const result = await runBackendRequest(get, active.text);
      settleActive(get, set, active.id, result);
      active = findActive(get);
    }
  } finally {
    set(drainingAtom, false);
  }
}

async function runBackendRequest(
  get: Getter,
  text: string
): Promise<BackendResult | undefined> {
  const backendClient = get(homeScreenConfigAtom).backendClient;
  if (backendClient === undefined) {
    return undefined;
  }

  try {
    const ack = await backendClient.submitMessage({ text });
    return {
      kind: 'success',
      text: sanitizeDisplayText(`Rust backend ACK - received: ${ack.receivedText}`)
    };
  } catch (error) {
    return { kind: 'error', text: sanitizeDisplayText(backendErrorMessage(error)) };
  }
}

function settleActive(
  get: Getter,
  set: Setter,
  id: number,
  result: BackendResult | undefined
): void {
  set(promptQueueAtom, (queue) => {
    let promoted = false;
    return queue.map((item) => {
      if (item.id === id) {
        return { ...item, state: 'settled' as const, result };
      }
      if (!promoted && item.state === 'queued') {
        promoted = true;
        return { ...item, state: 'active' as const };
      }
      return item;
    });
  });
  syncBodyEntries(get, set);
}

function findActive(get: Getter): QueueItem | undefined {
  return get(promptQueueAtom).find((item) => item.state === 'active');
}

function syncBodyEntries(get: Getter, set: Setter): void {
  set(submittedPromptEntriesAtom, queueToBodyEntries(get(promptQueueAtom)));
}

function queueToBodyEntries(queue: readonly QueueItem[]): BodyEntry[] {
  return queue.flatMap((item) => {
    const promptText = sanitizeDisplayText(item.text);
    const promptEntry: BodyEntry =
      item.state === 'queued'
        ? { id: `prompt-${item.id}`, kind: 'pending', text: promptText }
        : { id: `prompt-${item.id}`, kind: 'prompt', text: promptText };

    return item.result === undefined
      ? [promptEntry]
      : [promptEntry, { id: `result-${item.id}`, kind: item.result.kind, text: item.result.text }];
  });
}

function backendErrorMessage(error: unknown): string {
  if (error instanceof BackendClientError) {
    return `Rust backend failed: ${error.message}`;
  }
  return `Rust backend failed: ${error instanceof Error ? error.message : String(error)}`;
}
