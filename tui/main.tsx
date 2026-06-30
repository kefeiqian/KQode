import { render } from 'ink';
import { Provider } from 'jotai';
import { App } from '@/App.tsx';
import { createAppRuntime } from '@/bootstrap.ts';

const { store, dispose } = await createAppRuntime({ entryUrl: import.meta.url });

const { waitUntilExit } = render(
  <Provider store={store}>
    <App />
  </Provider>
);

void waitUntilExit().finally(dispose);
