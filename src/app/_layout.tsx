import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  AppState,
  useColorScheme,
  BackHandler,
} from 'react-native';
import AppText from '@/components/atoms/AppText';
import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useDiaryStore } from '../store/useDiaryStore';
import InitialLoadingScreen from '@/components/InitialLoadingScreen';
import NumberKeypad from '@/components/common/NumberKeypad';
import * as Haptics from 'expo-haptics';

import Toast, { ToastConfigParams } from 'react-native-toast-message';
import { getToastConfig } from '@/components/common/ToastConfig';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLockEnabled, pinCode, isBiometricEnabled, theme, setAppReady } =
    useDiaryStore();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    KyoboHandwriting: require('../../assets/fonts/KyoboHandwriting.ttf'),
    NanumSquareRound: require('../../assets/fonts/NanumSquareRound.ttf'),
    NanumSquareRoundB: require('../../assets/fonts/NanumSquareRoundB.ttf'),
    GowunBatang: require('../../assets/fonts/GowunBatang.ttf'),
    IsYun: require('../../assets/fonts/IsYun.ttf'),
  });

  // 다크모드 판별 로직
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState(!isLockEnabled);
  const [currentInput, setCurrentInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAuthenticating = useRef(false);
  const isUnlockedRef = useRef(!isLockEnabled);

  useEffect(() => {
    if (fontsLoaded) {
      // 1. 폰트 로딩이 완료되면 OS 기본 스플래시 화면을 내립니다.
      SplashScreen.hideAsync();

      // 2. 커스텀 로딩 화면을 약 1.5초간 노출 후 앱으로 진입합니다.
      // (DB 동기화 등 무거운 초기 작업이 있다면 여기서 await로 처리하면 됩니다.)
      const timer = setTimeout(() => {
        setShowCustomSplash(false);
      }, 1750);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  // 안드로이드 물리 뒤로 가기 버튼 방어 로직
  useEffect(() => {
    const backAction = () => {
      // 1. 잠금 화면 상태(!isUnlocked)일 때
      if (!isUnlocked) {
        // 뒤로 가기를 누르면 잠금을 뚫는 대신 앱을 종료해버림
        BackHandler.exitApp();

        // true를 반환하면 리액트 네이티브의 기본 뒤로 가기 동작을 무시함
        return true;
      }

      // 잠금이 해제된 상태라면 기본 동작(정상적인 뒤로 가기) 수행
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isUnlocked]); // isUnlocked 상태가 변할 때마다 이벤트를 갱신합니다.

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const store = useDiaryStore.getState();

      if (nextAppState === 'background') {
        // [수정됨] 공유 창 등 시스템 액션 중이 아닐 때만 잠금 활성화
        if (store.isLockEnabled && !store.isSystemAction) {
          setIsUnlocked(false);
          setCurrentInput('');
        }
      } else if (nextAppState === 'active') {
        // [수정됨] 앱으로 돌아왔을 때 시스템 액션 상태였다면, 잠금은 무시하고 플래그만 초기화
        if (store.isSystemAction) {
          store.setIsSystemAction(false);
        } else if (
          store.isLockEnabled &&
          store.isBiometricEnabled &&
          !isUnlockedRef.current &&
          !isAuthenticating.current &&
          !showCustomSplash
        ) {
          handleBiometricAuth();
        }
      }
    });

    // 초기 진입 시 로딩 화면이 끝난 후에만 생체인식을 호출하도록 조건 추가
    if (
      isLockEnabled &&
      isBiometricEnabled &&
      !isUnlockedRef.current &&
      !isAuthenticating.current &&
      !showCustomSplash
    ) {
      handleBiometricAuth();
    }
    return () => subscription.remove();
  }, [isLockEnabled, isBiometricEnabled, showCustomSplash]);

  useEffect(() => {
    setAppReady(!showCustomSplash && isUnlocked);
  }, [showCustomSplash, isUnlocked, setAppReady]);

  const handleBiometricAuth = async () => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: '일기장 잠금 해제',
        cancelLabel: '앱 비밀번호 입력',
        fallbackLabel: '',
        disableDeviceFallback: true,
      });
      if (auth.success) setIsUnlocked(true);
    } finally {
      setTimeout(() => {
        isAuthenticating.current = false;
      }, 500);
    }
  };

  const handleNumberPress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentInput.length < 4) {
      const newInput = currentInput + num;
      setCurrentInput(newInput);
      setErrorMsg('');

      if (newInput.length === 4) {
        setTimeout(() => {
          if (newInput === pinCode) {
            setIsUnlocked(true);
            setCurrentInput('');
          } else {
            setErrorMsg('비밀번호가 틀렸습니다.');
            setCurrentInput('');
          }
        }, 200);
      }
    }
  };

  // 폰트가 로드되기 전까지는 아무것도 렌더링하지 않음 (기본 스플래시 유지)
  if (!fontsLoaded) return null;

  // 폰트 로드 후, 지정된 시간 동안 커스텀 로딩 화면 렌더링
  // if (showCustomSplash) {
  //   return <InitialLoadingScreen />;
  // }

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#111111',
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#fcfbfa',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111111' : '#fcfbfa' }}>
      {/* 앱 메인 화면 렌더링 영역 */}
      <View
        style={{
          flex: 1,
          display: isUnlocked ? 'flex' : 'none',
        }}
      >
        <ThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
          <Stack
            screenOptions={{
              // headerStyle: { backgroundColor: isDark ? '#111' : '#fcfbfa' },
              // headerTintColor: isDark ? '#fff' : '#000',
              headerShadowVisible: false,
              // contentStyle: { backgroundColor: isDark ? '#111' : '#fcfbfa' },

              // iOS 스와이프 뒤로가기 시 테두리에 생기는 그림자(하얀 선)를 제거합니다.
              fullScreenGestureShadowEnabled: false,

              cardShadowEnabled: false,

              // 혹시 모를 그림자 효과를 한 번 더 차단합니다.
              gestureEnabled: true,

              animation: 'slide_from_right',
              // 카드 오버레이(iOS 특유의 뒤쪽 화면 어두워짐/그림자 효과)를 강제로 끕니다.
              cardOverlayEnabled: false,
              // 스와이프 제스처 시의 배경색을 아예 다크 모드 색상으로 덮어버립니다.
              cardStyle: { backgroundColor: isDark ? '#111111' : '#FCFBFA' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="emotion-select" />
            <Stack.Screen name="diary-list" />
            <Stack.Screen name="diary/[id]" />
            <Stack.Screen
              name="write"
              options={{
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="search" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="lock-settings" />
            <Stack.Screen name="language-settings" />
            <Stack.Screen name="theme-settings" />
            <Stack.Screen
              name="memo-editor"
              options={{
                animation: 'slide_from_bottom',
                headerShown: false,
              }}
            />
          </Stack>
        </ThemeProvider>
      </View>

      {!showCustomSplash && !isUnlocked && (
        <View
          style={[
            styles.lockContainer,
            isDark && styles.darkContainer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.pinArea}>
            <AppText style={styles.pinTitle}>
              {errorMsg
                ? '비밀번호가 일치하지 않아요'
                : '비밀번호를 입력해 주세요'}
            </AppText>

            <View style={styles.dotContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.dotWrapper}>
                  {currentInput.length > i ? (
                    <AppText
                      style={[styles.asterisk, isDark && styles.darkAsterisk]}
                    >
                      *
                    </AppText>
                  ) : (
                    <View style={[styles.dot, isDark && styles.darkDot]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.keypadWrapper}>
            <NumberKeypad
              onNumberPress={handleNumberPress}
              onDeletePress={() => setCurrentInput((prev) => prev.slice(0, -1))}
              showBiometric={isBiometricEnabled}
              onBiometricPress={
                isBiometricEnabled ? handleBiometricAuth : undefined
              }
              isDark={isDark}
            />
          </View>
        </View>
      )}

      {showCustomSplash && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <InitialLoadingScreen />
        </View>
      )}

      <Toast config={getToastConfig(isDark)} />
    </View>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    backgroundColor: '#fcfbfa',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  darkContainer: { backgroundColor: '#111111' },
  pinArea: { alignItems: 'center', paddingTop: 110 },

  pinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 30,
  },

  dotContainer: { flexDirection: 'row', gap: 20 },

  dotWrapper: {
    width: 16,
    height: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  asterisk: {
    fontSize: 24,
    lineHeight: 28,
  },

  dot: {
    width: 14,
    height: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  darkDot: {
    borderColor: '#666',
  },

  keypadWrapper: {
    marginTop: 'auto',
    paddingBottom: 50,
  },

  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  lightToast: { backgroundColor: '#393939' },
  darkToast: { backgroundColor: '#202020' },
  toastTextWrapper: { marginLeft: 12, flex: 1 },
  toastText1: { fontSize: 16, lineHeight: 24 },
  toastText2: { fontSize: 13, lineHeight: 20 },
  lightText: { color: '#ffffff' },
  darkText: { color: '#ffffff' },
  lightSubText: { color: '#aaa' },
  darkSubText: { color: '#aaa' },
});
