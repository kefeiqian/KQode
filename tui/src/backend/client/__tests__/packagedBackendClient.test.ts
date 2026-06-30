import { describe, expect, it } from 'vitest';
import { BackendErrorKind } from '@contracts/backend/index.ts';
import { BackendLifecycleState } from '@backend/client/backendClient.ts';
import { createPackagedBackendClient } from '@backend/client/packagedBackendClient.ts';

describe('createPackagedBackendClient (stub)', () => {
  it('fails closed with a launch error until packaged launch is implemented', async () => {
    const client = createPackagedBackendClient({ workspaceCwd: process.cwd() });

    await expect(client.submitMessage({ text: 'hello' })).rejects.toMatchObject({
      kind: BackendErrorKind.Launch
    });
    expect(client.getState()).toBe(BackendLifecycleState.Dead);

    client.dispose();
  });
});
