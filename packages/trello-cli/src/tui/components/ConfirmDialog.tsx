import React from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../state/NavigationContext";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { config } = useNavigation();

  useInput((input, key) => {
    if (input === "y" || input === "Y") {
      onConfirm();
    } else {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={config.theme.warning}
      paddingX={2}
      paddingY={1}
    >
      <Text color={config.theme.warning} bold>
        Confirm
      </Text>
      <Text>{message}</Text>
      <Box marginTop={1}>
        <Text color={config.theme.accent}>[y] Yes</Text>
        <Text> </Text>
        <Text color={config.theme.error}>[any key] No</Text>
      </Box>
    </Box>
  );
}
