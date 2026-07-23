import React from 'react';
import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { useDiaryStore } from '@/store/useDiaryStore';
import { FONT_SIZES } from '@/constants/font';

interface AppTextProps extends TextProps {
  useDiaryFont?: boolean;
  useDiarySize?: boolean;
}

export default function AppText({
  useDiaryFont = false,
  useDiarySize = false,
  ...props
}: AppTextProps) {
  const { theme, diaryFontFamily, diaryFontSize } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const defaultColor = isDark ? '#ffffff' : '#212529';

  const flattenedStyle = StyleSheet.flatten(props.style) || {};

  let currentFontFamily = 'NanumSquareRound';
  if (useDiaryFont && diaryFontFamily !== 'System') {
    currentFontFamily = diaryFontFamily;
  } else if (flattenedStyle.fontFamily) {
    currentFontFamily = flattenedStyle.fontFamily;
  }

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

  let sizeStyle: any = {};
  if (useDiarySize && diaryFontSize) {
    const currentSizePx = FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES];
    sizeStyle = {
      fontSize: currentSizePx,
      lineHeight: currentSizePx * 1.5,
    };
  }

  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: finalFontFamily,
          color: defaultColor,
          letterSpacing: -0.6,
        },
        sizeStyle,
        restStyle,
      ]}
    >
      {props.children}
    </Text>
  );
}
