/**
 * Wire contract for the KQode backend message protocol.
 *
 * This module is a dependency-free seam shared by the `@state` and `@backend`
 * layers: it must not import from either side (or pull in transport libraries
 * such as `vscode-jsonrpc`) so it can never participate in a layer cycle.
 */

/** KQode-owned JSON-RPC method that acknowledges a submitted prompt. */
export const MESSAGE_SUBMIT_METHOD = 'kqode.message.submit';

/** ACK text the first-slice Rust backend returns for a received prompt. */
export const ACK_MESSAGE = 'ACK: message received';

/** Params for `kqode.message.submit`; intentionally text-only for this slice. */
export type MessageSubmitParams = {
  text: string;
};

/** Result for `kqode.message.submit`. */
export type MessageSubmitResult = {
  message: string;
  receivedText: string;
};
