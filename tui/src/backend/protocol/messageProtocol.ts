import { RequestType } from 'vscode-jsonrpc';
import { MESSAGE_SUBMIT_METHOD } from '@contracts/backend/index.js';
import type { MessageSubmitParams, MessageSubmitResult } from '@contracts/backend/index.js';

/**
 * Typed request descriptor for `kqode.message.submit`.
 *
 * Routing the method through a single `RequestType` keeps the KQode-owned method
 * name out of call sites while `vscode-jsonrpc` owns request IDs and framing. The
 * method name and wire shapes come from the dependency-free `@contracts` seam.
 */
export const messageSubmitRequest = new RequestType<MessageSubmitParams, MessageSubmitResult, void>(
  MESSAGE_SUBMIT_METHOD
);
