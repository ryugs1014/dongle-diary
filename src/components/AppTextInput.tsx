import React from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useDiaryStore } from '@/store/useDiaryStore';

export default function AppTextInput(props: TextInputProps) {
  // 1. 다크모드 판별 로직 추가
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // 💡 다크모드 여부에 따른 기본 글자 색상 지정
  const defaultColor = isDark ? '#ffffff' : '#212529';

  // 1. 스타일 배열을 하나로 합쳐서(flatten) 객체 형태로 만듭니다.
  const flattenedStyle = StyleSheet.flatten(props.style) || {};

  // 2. 폰트 지정이 없다면 나눔스퀘어라운드를 기본값으로 설정합니다.
  const currentFontFamily = flattenedStyle.fontFamily || 'NanumSquareRound';

  // 3. 굵기(fontWeight)가 볼드 계열인지 확인합니다.
  const isBold =
    flattenedStyle.fontWeight === 'bold' ||
    flattenedStyle.fontWeight === '600' ||
    flattenedStyle.fontWeight === '700' ||
    flattenedStyle.fontWeight === '800' ||
    flattenedStyle.fontWeight === '900';

  // 4. 나눔스퀘어라운드이면서 볼드 처리된 경우 볼드체 파일로 변경합니다.
  let finalFontFamily = currentFontFamily;
  if (currentFontFamily === 'NanumSquareRound' && isBold) {
    finalFontFamily = 'NanumSquareRoundB';
  }

  // 5. 폰트 깨짐 방지를 위해 fontWeight 속성을 제거한 나머지 스타일만 추출합니다.
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
