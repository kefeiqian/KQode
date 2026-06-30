import { createStore } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import { backendClientAtom } from '@state/global/backend.ts';
import { BACKEND_LOADING_HINT, startupStatusHintAtom } from '@state/global/statusHint.ts';
import { startBackendRuntime } from '@backend/runtime/backendRuntime.ts';
import type { RuntimeBackendClient } from '@backend/runtime/backendRuntime.ts';

function fakeClient(overrides: Partial<RuntimeBackendClient> = {}): RuntimeBackendClient {
  return {
    submitMessage: vi.fn(),
    ensureStarted: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    ...overrides
  } as unknown as RuntimeBackendClient;
}

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('startBackendRuntime', () => {
  it('injects the client and eagerly starts it behind the loading hint', async () => {
    const store = createStore();
    const client = fakeClient();

    const dispose = startBackendRuntime(store, client);

    expect(store.get(backendClientAtom)).toBe(client);
    expect(client.ensureStarted).toHaveBeenCalledTimes(1);
    expect(store.get(startupStatusHintAtom)).toEqual(BACKEND_LOADING_HINT);

    await flushMicrotasks();

    expect(store.get(startupStatusHintAtom)).toBeUndefined();
    expect(store.get(backendClientAtom)).toBe(client);

    dispose();
    expect(client.dispose).toHaveBeenCalledTimes(1);
  });

  it('clears the seam and disposes the client when eager start fails', async () => {
    const store = createStore();
    const client = fakeClient({
      ensureStarted: vi.fn().mockRejectedValue(new Error('launch failed'))
    });

    startBackendRuntime(store, client);
    expect(store.get(backendClientAtom)).toBe(client);

    await flushMicrotasks();

    expect(client.dispose).toHaveBeenCalledTimes(1);
    expect(store.get(backendClientAtom)).toBeUndefined();
    expect(store.get(startupStatusHintAtom)).toBeUndefined();
  });
});
