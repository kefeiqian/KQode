import { BackendClientError, BackendErrorKind } from '@contracts/backend/index.ts';
import type { EmbeddedBackendAsset } from '@backend/packaged/materializeBackend.ts';

/**
 * Resolves the embedded backend asset for the running packaged executable.
 *
 * The real byte source is wired by the packaging build (it reads the file
 * embedded by `bun build --compile`). Until then this placeholder carries the
 * build-time digest but fails closed when its bytes are requested, so the
 * packaged client surfaces a typed `launch` error instead of looking connected.
 * This module is only ever loaded inside the packaged composition branch, never
 * by the source/dev runtime.
 */
export function loadEmbeddedBackendAsset(): EmbeddedBackendAsset {
  return {
    sha256: process.env.KQODE_BACKEND_SHA256 ?? '',
    readBytes: () =>
      Promise.reject(
        new BackendClientError(
          BackendErrorKind.Launch,
          'embedded backend asset is provided by the packaging build'
        )
      )
  };
}
