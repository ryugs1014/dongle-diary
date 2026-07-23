import React from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useDiaryStore } from '@/store/useDiaryStore';

export default function AppTextInput(props: TextInputProps) {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const defaultColor = isDark ? '#ffffff' : '#212529';

  const flattenedStyle = StyleSheet.flatten(props.style) || {};

  const currentFontFamily = flattenedStyle.fontFamily || 'NanumSquareRound';

  const isBold =
    flattenedStyle.fontWeight === 'bold' ||
    flattenedStyle.fontWeight === '600' ||
    flattenedStyle.fontWeight === '700' ||
    flattenedStyle.fontWeight === '800' ||
    flattenedStyle.fontWeight === '900';

  let finalFontFamily = currentFontFamily;
  if (currentFontFamily === 'NanumSquareRound' && isBold) {
    finalFontFamily = 'NanumSquareRoundB';
  }

  const { fontWeight, ...restStyle } = flattenedStyle;

  return (
    <TextInput
      {...props}
      style={[
        {
          fontFamily: finalFontFamily,
          color: defaultColor,
          // letterSpacing: -0.6,
        },
        restStyle, // fontWeight가 빠진 안전한 스타일 적용
      ]}
    />
  );
}
