import React from 'react';
import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { useDiaryStore } from '@/store/useDiaryStore';

export default function AppText(props: TextProps) {
  // 1. 다크모드 판별 로직 추가
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // 💡 다크모드 여부에 따른 기본 글자 색상 지정
  const defaultColor = isDark ? '#ffffff' : '#212529';

  // 1. 배열 형태로 들어올 수 있는 스타일을 하나로 합쳐서(flatten) 분석하기 쉽게 만듭니다.
  const flattenedStyle = StyleSheet.flatten(props.style) || {};

  // 2. 다른 화면(설정 등)에서 강제로 폰트를 넘겼는지 확인 (없으면 기본값 나눔스퀘어라운드)
  const currentFontFamily = flattenedStyle.fontFamily || 'NanumSquareRound';

  // 3. 굵기(fontWeight)가 볼드 계열인지 확인합니다.
  const isBold =
    flattenedStyle.fontWeight === 'bold' ||
    flattenedStyle.fontWeight === '600' ||
    flattenedStyle.fontWeight === '700' ||
    flattenedStyle.fontWeight === '800' ||
    flattenedStyle.fontWeight === '900';

  // 4. 적용할 최종 폰트 결정 (나눔스퀘어 && 볼드일 때만 볼드 파일로 교체)
  let finalFontFamily = currentFontFamily;
  if (currentFontFamily === 'NanumSquareRound' && isBold) {
    finalFontFamily = 'NanumSquareRoundB';
  }

  // 5. ⭐️ 핵심: 리액트 네이티브 버그 방지를 위해 기존 fontWeight 속성은 지워버립니다.
  const { fontWeight, ...restStyle } = flattenedStyle;

  return (
    <Text
      {...props}
      style={[
        // 💡 2. 폰트와 함께 기본 색상(defaultColor)을 깔아줍니다.
        {
          fontFamily: finalFontFamily,
          color: defaultColor,
          letterSpacing: -0.6,
        },
        restStyle, // 개별 컴포넌트에서 따로 color를 지정했다면 여기서 덮어씌워집니다.
      ]}
    >
      {props.children}
    </Text>
  );
}
