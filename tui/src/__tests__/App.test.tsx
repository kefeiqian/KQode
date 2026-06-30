import { createStore } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/App.js';
import { seedScreenState } from '@state/global/index.js';
import { flushInput } from '@test/flushInput.js';
import { renderWithJotai } from '@test/renderWithJotai.js';

function deferredPromise<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

async function waitForFrame(
  getFrame: () => string | undefined,
  predicate: (frame: string) => boolean
): Promise<string> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const frame = getFrame() ?? '';
    if (predicate(frame)) {
      return frame;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`timed out waiting for frame. Last frame:\n${getFrame() ?? ''}`);
}

describe('App', () => {
  it('smoke renders product metadata and workspace cwd', () => {
    const workspaceCwd = 'C:\\Users\\kefeiqian\\Projects\\dummy-react-app';
    const screen = { productVersion: '0.1.0', workspaceCwd, columns: 100, rows: 20, startupTasks: [] };
    const store = createStore();
    seedScreenState(store, screen, { windowColumns: screen.columns, windowRows: screen.rows });
    const { lastFrame } = renderWithJotai(
      <App />,
      store
    );

    const output = lastFrame() ?? '';

    expect(output).toContain('KQode');
    expect(output).toContain('v0.1.0');
    expect(output).toContain('~\\Projects\\dummy-react-app');
    expect(output).not.toContain('Preview mode: local Rust backend only');
  });

  it('reflows to the latest terminal size after stdout resize events', async () => {
    const workspaceCwd = 'C:\\Users\\kefeiqian\\Projects\\dummy-react-app';
    const screen = { productVersion: '0.1.0', workspaceCwd, startupTasks: [] as const };
    const store = createStore();
    seedScreenState(store, screen);
    const { lastFrame, stdout } = renderWithJotai(
      <App />,
      store
    );

    await flushInput();
    Object.defineProperty(stdout, 'columns', { configurable: true, value: 80 });
    Object.defineProperty(stdout, 'rows', { configurable: true, value: 18 });
    stdout.emit('resize');
    await flushInput();

    const outputRows = (lastFrame() ?? '').split('\n');
    expect(outputRows).toHaveLength(18);
    expect(outputRows.at(-1)).toContain('/ commands | @ mention | ? help');
  });

  it('keeps the layout at the minimum height when the terminal shrinks below 10 rows', async () => {
    const workspaceCwd = 'C:\\Users\\kefeiqian\\Projects\\dummy-react-app';
    const screen = { productVersion: '0.1.0', workspaceCwd, startupTasks: [] as const };
    const store = createStore();
    seedScreenState(store, screen);
    const { lastFrame, stdout } = renderWithJotai(
      <App />,
      store
    );

    await flushInput();
    Object.defineProperty(stdout, 'columns', { configurable: true, value: 80 });
    Object.defineProperty(stdout, 'rows', { configurable: true, value: 8 });
    stdout.emit('resize');
    await flushInput();

    const outputRows = (lastFrame() ?? '').split('\n');
    expect(outputRows).toHaveLength(10);
    expect(outputRows.at(-1)).toContain('/ commands | @ mention | ? help');
  });

  it('preloads startup tasks on mount, locks composer input, then restores the default hints', async () => {
    const workspaceCwd = 'C:\\Users\\kefeiqian\\Projects\\dummy-react-app';
    const screen = { productVersion: '0.1.0', workspaceCwd, columns: 100, rows: 20 };
    const store = createStore();
    seedScreenState(store, screen, { windowColumns: screen.columns, windowRows: screen.rows });
    const { lastFrame, stdin } = renderWithJotai(
      <App />,
      store
    );

    stdin.write('blocked while loading');
    await flushInput();
    expect(lastFrame() ?? '').toContain('> blocked while loading');

    stdin.write('ready now');
    await flushInput();
    expect(lastFrame() ?? '').toContain('> blocked while loadingready now');
  });
});
