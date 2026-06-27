import { Box, Text } from 'ink';

export type AppProps = {
  productVersion: string;
  workspaceCwd: string;
};

export function App({ productVersion, workspaceCwd }: AppProps) {
  return (
    <Box flexDirection="column">
      <Text color="cyan">KQode {productVersion}</Text>
      <Text color="gray">Workspace: {workspaceCwd}</Text>
      <Text>Preview mode: local Rust backend only.</Text>
    </Box>
  );
}
