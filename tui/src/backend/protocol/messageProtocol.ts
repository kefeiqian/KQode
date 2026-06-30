import { RequestType } from 'vscode-jsonrpc';

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

/**
 * Typed request descriptor for `kqode.message.submit`.
 *
 * Routing the method through a single `RequestType` keeps the KQode-owned method
 * name out of call sites while `vscode-jsonrpc` owns request IDs and framing.
 */
export const messageSubmitRequest = new RequestType<MessageSubmitParams, MessageSubmitResult, void>(
  MESSAGE_SUBMIT_METHOD
);
