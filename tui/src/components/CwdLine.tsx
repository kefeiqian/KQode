import { Box, Text } from 'ink';
import { useAtomValue } from 'jotai';
import { formatCwdLine } from '@libs/tui/cwdLine.js';
import { gitStatusLabelAtom, workspaceCwdAtom } from '@state/global/index.js';
import { theme } from '@theme/themeConfig.js';

export function CwdLine() {
  const workspaceCwd = useAtomValue(workspaceCwdAtom);
  const gitStatusLabel = useAtomValue(gitStatusLabelAtom);

  return (
    <Box>
      <Text color={theme.colors.foreground}>{formatCwdLine(workspaceCwd, gitStatusLabel)}</Text>
    </Box>
  );
}
