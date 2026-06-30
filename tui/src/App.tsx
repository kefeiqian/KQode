import { useWindowSize } from 'ink';
import { useSetAtom } from 'jotai';
import { useLayoutEffect } from 'react';
import { HomeScreen } from '@components/HomeScreen/index.js';
import { windowColumnsAtom, windowRowsAtom } from '@state/global/index.js';

export function App() {
  const windowSize = useWindowSize();
  const setWindowColumns = useSetAtom(windowColumnsAtom);
  const setWindowRows = useSetAtom(windowRowsAtom);

  useLayoutEffect(() => {
    setWindowColumns(windowSize.columns);
    setWindowRows(windowSize.rows);
  }, [setWindowColumns, setWindowRows, windowSize.columns, windowSize.rows]);

  return <HomeScreen />;
}
