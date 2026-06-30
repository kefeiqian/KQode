import { render } from 'ink';
import { Provider } from 'jotai';
import { App } from '@/App.tsx';
import { createAppRuntime } from '@/bootstrap.ts';

const { store, dispose } = await createAppRuntime({ entryUrl: import.meta.url });

const { waitUntilExit } = render(
  <Provider store={store}>
    <App />
  </Provider>,
  // Rewrite only changed lines instead of repainting the whole screen each
  // frame. Paired with FULLSCREEN_GUARD_ROWS keeping us under fullscreen, this
  // avoids the per-keystroke clear+repaint that blinks in WezTerm on Windows.
  { incrementalRendering: true }
);

void waitUntilExit().finally(dispose);
