import { render } from 'ink';
import { Provider } from 'jotai';
import { App } from '@/App.tsx';
import { createAppRuntime } from '@/bootstrap.ts';
import { finishSession } from '@libs/exitSummary/finishSession.ts';
import { loadEmbeddedBackendAsset } from './embeddedBackendAsset.ts';

// Packaged (`bun build --compile`) entrypoint. Mirrors `main.tsx` but injects
// the embedded backend asset so the Bun-only embedding stays out of the source
// graph. `--define KQODE_DISTRIBUTION="packaged"` selects the packaged branch.
const { store, dispose } = await createAppRuntime({
  entryUrl: import.meta.url,
  loadPackagedAsset: loadEmbeddedBackendAsset
});

const { waitUntilExit } = render(
  <Provider store={store}>
    <App />
  </Provider>,
  { incrementalRendering: true }
);

void waitUntilExit().finally(() => finishSession({ store, dispose }));
