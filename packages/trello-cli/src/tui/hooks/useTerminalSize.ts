import { useState, useEffect } from "react";
import { useStdout } from "ink";

interface TerminalSize {
  columns: number;
  rows: number;
}

export function useTerminalSize(): TerminalSize {
  const { stdout } = useStdout();

  const [size, setSize] = useState<TerminalSize>({
    columns: stdout?.columns || 80,
    rows: stdout?.rows || 24,
  });

  useEffect(() => {
    if (!stdout) return;

    const onResize = () => {
      setSize({
        columns: stdout.columns || 80,
        rows: stdout.rows || 24,
      });
    };

    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return size;
}

export function getListColumns(width: number): number {
  if (width >= 160) return 4;
  if (width >= 120) return 3;
  if (width >= 80) return 2;
  return 1;
}

export function getListWidth(terminalWidth: number, numColumns: number): number {
  // Account for borders and padding
  const availableWidth = terminalWidth - 4;
  return Math.floor(availableWidth / numColumns) - 2;
}
