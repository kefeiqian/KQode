import { type MessageConnection } from 'vscode-jsonrpc';
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter
} from 'vscode-jsonrpc/node';
import { BackendClientError, BackendErrorKind } from '@backend/client/backendClient.js';
import type { BackendClient } from '@backend/client/backendClient.js';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '@backend/backendConstants.js';
import type { LaunchedBackend } from '@backend/process/backendProcess.js';
import { createMessageConnectionClient } from '@backend/client/messageConnectionClient.js';
import type { MessageSubmitParams, MessageSubmitResult } from '@backend/protocol/messageProtocol.js';

/** Lifecycle of the TUI-owned backend connection. */
export const BackendLifecycleState = {
  /** No backend has been launched yet. */
  Idle: 'idle',
  /** A backend launch/connect is in flight. */
  Starting: 'starting',
  /** The backend is connected and accepting requests. */
  Ready: 'ready',
  /** The TUI is disposing the backend on purpose. */
  Closing: 'closing',
  /** The backend exited, crashed, or a fatal transport error occurred. */
  Dead: 'dead'
} as const;

export type BackendLifecycleState =
  (typeof BackendLifecycleState)[keyof typeof BackendLifecycleState];

/** Process-backed {@link BackendClient} that owns one child backend at a time. */
export type ProcessBackendClient = BackendClient & {
  getState(): BackendLifecycleState;
  ensureStarted(): Promise<void>;
  dispose(): void;
};

export type ProcessBackendClientOptions = {
  launch: () => Promise<LaunchedBackend>;
  requestTimeoutMs?: number;
};

type BackendSession = {
  backend: LaunchedBackend;
  connection: MessageConnection;
  client: BackendClient;
};

/**
 * Creates a JSON-RPC client over a launched child backend.
 *
 * One backend serves the whole TUI session. Recoverable method errors keep the
 * process alive; fatal transport/timeout/exit failures dispose the connection
 * and mark the client `dead`. The next submit after `dead` respawns a fresh
 * backend (persisted session restore is added with the session methods), never
 * silently and never auto-replaying interrupted work.
 */
export function createProcessBackendClient({
  launch,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
}: ProcessBackendClientOptions): ProcessBackendClient {
  let state: BackendLifecycleState = BackendLifecycleState.Idle;
  let session: BackendSession | null = null;
  let starting: Promise<BackendSession> | null = null;

  const teardown = (nextState: BackendLifecycleState): void => {
    const current = session;
    session = null;
    state = nextState;
    if (current !== null) {
      current.connection.dispose();
      current.backend.dispose();
    }
  };

  const markDead = (): void => {
    if (state === BackendLifecycleState.Closing || state === BackendLifecycleState.Dead) {
      return;
    }
    teardown(BackendLifecycleState.Dead);
  };

  const start = async (): Promise<BackendSession> => {
    state = BackendLifecycleState.Starting;
    let backend: LaunchedBackend;
    try {
      backend = await launch();
    } catch (error) {
      state = BackendLifecycleState.Dead;
      throw toLaunchError(error);
    }

    // The client may have been disposed (or marked dead) while the launch was in
    // flight. Only `dispose()` can change state during this window because no
    // connection/exit listeners are wired yet; reclaim the process instead of
    // resurrecting a backend nobody will dispose.
    if (state !== BackendLifecycleState.Starting) {
      backend.dispose();
      throw new BackendClientError(
        BackendErrorKind.Launch,
        'backend launch was aborted before it became ready'
      );
    }

    const connection = createMessageConnection(
      new StreamMessageReader(backend.stdout),
      new StreamMessageWriter(backend.stdin)
    );
    connection.onClose(markDead);
    connection.onError(markDead);
    backend.onExit(markDead);
    connection.listen();

    const opened: BackendSession = {
      backend,
      connection,
      client: createMessageConnectionClient(connection)
    };
    session = opened;
    state = BackendLifecycleState.Ready;
    return opened;
  };

  const ensureSession = (): Promise<BackendSession> => {
    if (session !== null && state === BackendLifecycleState.Ready) {
      return Promise.resolve(session);
    }
    if (starting === null) {
      starting = start().finally(() => {
        starting = null;
      });
    }
    return starting;
  };

  return {
    getState: () => state,
    async ensureStarted(): Promise<void> {
      await ensureSession();
    },
    async submitMessage(params: MessageSubmitParams): Promise<MessageSubmitResult> {
      const active = await ensureSession();
      try {
        return await withRequestTimeout(active.client.submitMessage(params), requestTimeoutMs);
      } catch (error) {
        if (isFatalBackendError(error)) {
          markDead();
        }
        throw error;
      }
    },
    dispose() {
      if (state === BackendLifecycleState.Dead) {
        return;
      }
      state = BackendLifecycleState.Closing;
      teardown(BackendLifecycleState.Dead);
    }
  };
}

function withRequestTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new BackendClientError(
          BackendErrorKind.Timeout,
          `backend request timed out after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isFatalBackendError(error: unknown): boolean {
  return error instanceof BackendClientError && error.kind !== BackendErrorKind.Protocol;
}

function toLaunchError(error: unknown): BackendClientError {
  if (error instanceof BackendClientError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new BackendClientError(BackendErrorKind.Launch, `failed to launch backend: ${message}`, {
    cause: error
  });
}
