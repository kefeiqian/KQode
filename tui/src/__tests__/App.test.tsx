import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { App } from '../App.js';

describe('App', () => {
  it('smoke renders product metadata, workspace cwd, and backend-only preview copy', () => {
    const workspaceCwd = 'C:\\Users\\kefeiqian\\Projects\\dummy-react-app';
    const { lastFrame } = render(<App productVersion="0.1.0" workspaceCwd={workspaceCwd} />);

    const output = lastFrame();

    expect(output).toContain('KQode 0.1.0');
    expect(output).toContain(`Workspace: ${workspaceCwd}`);
    expect(output).toContain('Preview mode: local Rust backend only.');
  });
});
