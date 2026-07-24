import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

export default function AppTouchableOpacity(props: TouchableOpacityProps) {
  const isProcessing = useRef(false);

  const handlePress = useCallback(
    (e: any) => {
      if (isProcessing.current) return;

      isProcessing.current = true;

      if (props.onPress) {
        props.onPress(e);
      }

      setTimeout(() => {
        isProcessing.current = false;
      }, 500);
    },
    [props.onPress],
    ``,
  );

  return <TouchableOpacity {...props} onPress={handlePress} />;
}
