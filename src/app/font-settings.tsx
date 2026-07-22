import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  PanResponder,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDiaryStore } from '../store/useDiaryStore';
import { FONT_SIZES, FONTS } from '@/constants/font';
import { BackIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/SvgDashedLine';
import RadioSettingItem from '@/components/RadioSettingItem';

export default function FontSettingsScreen() {
  const {
    diaryFontSize,
    diaryFontFamily,
    setDiaryFontSize,
    setDiaryFontFamily,
    theme,
  } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const currentSizePx = FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES];

  // --- 슬라이더 로직 시작 ---
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const sliderWidthRef = useRef(0);
  const startStepRef = useRef(diaryFontSize);

  const lastStepRef = useRef(diaryFontSize);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        setIsSliding(true);
        const width = sliderWidthRef.current;
        if (width > 0) {
          // 1. 처음 터치한 위치로 즉시 이동
          const ratio = Math.max(
            0,
            Math.min(1, evt.nativeEvent.locationX / width),
          );
          const step = Math.round(ratio * 4) + 1;
          setDiaryFontSize(step);

          // 터치한 곳이 기존 단계와 다르면 햅틱 발생 및 상태 업데이트
          if (lastStepRef.current !== step) {
            Haptics.selectionAsync();
            lastStepRef.current = step;
            setDiaryFontSize(step);
          }

          // 2. 드래그의 기준점이 될 시작 단계를 기억
          startStepRef.current = step;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const width = sliderWidthRef.current;
        if (width > 0) {
          // 3. 손가락이 이동한 거리(dx)를 단계로 환산하여 적용
          const stepWidth = width / 4; // 1단계당 픽셀 너비
          const moveSteps = Math.round(gestureState.dx / stepWidth);
          const newStep = Math.max(
            1,
            Math.min(5, startStepRef.current + moveSteps),
          );

          // 이동한 위치의 단계가 이전 단계와 다를 때만 햅틱 발생
          if (lastStepRef.current !== newStep) {
            Haptics.selectionAsync(); // 가벼운 '톡' 느낌의 햅틱
            lastStepRef.current = newStep;
            setDiaryFontSize(newStep);
          }
        }
      },
      onPanResponderRelease: () => setIsSliding(false),
      onPanResponderTerminate: () => setIsSliding(false),
    }),
  ).current;
  // --- 슬라이더 로직 끝 ---

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: !isSliding,
          fullScreenGestureEnabled: false,
        }}
      />
      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
        <View style={styles.headerTitleWrapper}>
          <AppText
            style={[styles.customHeaderTitle, isDark && styles.darkText]}
          >
            글꼴 · 크기
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        scrollEnabled={!isSliding}
      >
        <View style={styles.previewContainer}>
          {/*<AppText style={[styles.previewLabel, isDark && styles.darkSubText]}>*/}
          {/*  미리보기*/}
          {/*</AppText>*/}
          <View style={[styles.previewBox, isDark && styles.darkPreviewBox]}>
            <Text
              style={{
                fontSize: currentSizePx,
                fontFamily: diaryFontFamily,
                color: isDark ? '#ffffff' : '#333',
                lineHeight: currentSizePx * 1.5,
              }}
              textBreakStrategy="simple" // 안드로이드용
              lineBreakStrategyIOS="hangul-word" // iOS용 한국어 단어 끊김 방지
            >
              {/*오늘은 정말 기분 좋은 하루였다.{'\n'}*/}
              {/*다람쥐 헌 쳇바퀴에 타고파.*/}
              마음속에서 문장들이 파도처럼 밀려온다. 이 느낌을 놓치지 않으려고
              필사적으로 적는다. 글을 쓰는 순간만큼은 온전히 자유롭다.
            </Text>
          </View>
        </View>

        {/*<AppText style={[styles.sectionTitle, isDark && styles.darkSubText]}>*/}
        {/*  일기 글자 크기 ({diaryFontSize}단계)*/}
        {/*</AppText>*/}

        <View style={styles.sliderSection}>
          <AppText style={styles.fontExampleSmall}>가</AppText>

          <View
            style={styles.sliderTouchArea}
            onLayout={(e) => {
              sliderWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...panResponder.panHandlers}
          >
            <View pointerEvents="none" style={styles.sliderVisuals}>
              {/* 1. 회색 바탕 선 */}
              <View
                style={[styles.sliderTrack, isDark && styles.darkSliderTrack]}
              />

              {/* 2. 각 단계별 눈금 점 (가이드 역할) */}
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.tickMark,
                    isDark && styles.darkTickMark,
                    { left: `${((level - 1) / 4) * 100}%` }, // 0%, 25%, 50%... 위치에 배치
                  ]}
                />
              ))}

              {/* 3. 돌아다니는 하나의 동그라미 (Thumb) */}
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${((diaryFontSize - 1) / 4) * 100}%` }, // 현재 단계에 맞춰 이동
                ]}
              >
                {/* 동그라미 안쪽 포인트 컬러 */}
                <View style={styles.sliderThumbInner} />
              </View>
            </View>
          </View>

          <AppText style={styles.fontExampleLarge}>가</AppText>
        </View>

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <View style={styles.fontFamilyWrapper}>
          {FONTS.map((font, index) => (
            <View key={font.id}>
              <RadioSettingItem
                title={font.label}
                isSelected={diaryFontFamily === font.id}
                onPress={() => setDiaryFontFamily(font.id)}
                isDark={isDark}
                fontFamily={font.id} // 폰트 패밀리 주입!
              />
              {/*{index !== FONTS.length - 1 && (*/}
              {/*  <View style={styles.dividerWrapper}>*/}
              {/*    <SvgDashedLine />*/}
              {/*  </View>*/}
              {/*)}*/}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: {
    backgroundColor: '#111111',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerTitleWrapper: {
    flex: 2,
    alignItems: 'center',
  },
  customHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightIconsWrapper: {
    flex: 1,
  },
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },

  scrollWrapper: {
    paddingVertical: 10,
  },

  previewContainer: { paddingHorizontal: 20, marginBottom: 30 },
  previewLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewBox: {
    minHeight: 150,
    justifyContent: 'center',
  },
  // darkPreviewBox: { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' },

  sectionTitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    paddingHorizontal: 25,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },

  sliderSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    width: '100%',
  },
  fontExampleSmall: {
    fontSize: 12,
  },
  fontExampleLarge: {
    fontSize: 18,
  },
  sliderTouchArea: {
    height: 40,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  sliderVisuals: {
    width: '100%',
    height: 28, // 돌아다니는 동그라미 크기에 맞춰 여백 확보
    justifyContent: 'center',
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#eeeeee',
    borderRadius: 2,
  },
  darkSliderTrack: {
    backgroundColor: '#333333',
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 12,
    marginLeft: -1,
    backgroundColor: '#dddddd',
  },
  darkTickMark: {
    backgroundColor: '#555555',
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
    backgroundColor: '#111111',
    borderColor: '#ffffff',
    borderRadius: 14,
    marginLeft: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkSliderThumb: {
    borderColor: '#ffffff',
  },
  sliderThumbInner: {
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  sliderThumbInnerDark: {
    backgroundColor: '#ffffff',
  },
  dividerWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  fontFamilyWrapper: {
    paddingVertical: 20,
  },
});
