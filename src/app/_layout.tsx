import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useDiaryStore } from '../store/useDiaryStore';
import InitialLoadingScreen from '@/components/InitialLoadingScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLockEnabled, pinCode, isBiometricEnabled, theme } = useDiaryStore();

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
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const store = useDiaryStore.getState();
      // 앱이 백그라운드로 가면 즉시 잠금
      if (nextAppState === 'background') {
        if (store.isLockEnabled) {
          setIsUnlocked(false);
          setCurrentInput('');
        }
      } else if (nextAppState === 'active') {
        if (
          store.isLockEnabled &&
          store.isBiometricEnabled &&
          !isUnlockedRef.current &&
          !isAuthenticating.current &&
          !showCustomSplash // 로딩 화면 중에는 생체인식을 호출하지 않음
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
  }, [isLockEnabled, isBiometricEnabled]);

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
  if (showCustomSplash) {
    return <InitialLoadingScreen />;
  }

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
    <>
      {!isUnlocked && (
        <SafeAreaView
          style={[styles.lockContainer, isDark && styles.darkContainer]}
        >
          <View style={styles.pinArea}>
            <Ionicons
              name="lock-closed"
              size={48}
              color="#FF6F61"
              style={{ marginBottom: 20 }}
            />
            <AppText style={[styles.pinTitle, isDark && styles.darkText]}>
              일기장 잠금
            </AppText>
            <AppText style={[styles.pinSub, isDark && styles.darkSubText]}>
              비밀번호 4자리를 입력해주세요.
            </AppText>

            <View style={styles.dotContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    isDark && styles.darkDot,
                    currentInput.length > i && styles.dotFilled,
                  ]}
                />
              ))}
            </View>
            <AppText style={styles.errorText}>{errorMsg}</AppText>
          </View>

          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <AppTouchableOpacity
                key={num}
                style={styles.keypadBtn}
                onPress={() => handleNumberPress(num)}
              >
                <AppText style={[styles.keypadText, isDark && styles.darkText]}>
                  {num}
                </AppText>
              </AppTouchableOpacity>
            ))}
            <AppTouchableOpacity
              style={styles.keypadBtn}
              onPress={isBiometricEnabled ? handleBiometricAuth : undefined}
              disabled={!isBiometricEnabled}
            >
              {isBiometricEnabled && (
                <Ionicons name="finger-print" size={32} color="#FF6F61" />
              )}
            </AppTouchableOpacity>
            <AppTouchableOpacity
              style={styles.keypadBtn}
              onPress={() => handleNumberPress('0')}
            >
              <AppText style={[styles.keypadText, isDark && styles.darkText]}>
                0
              </AppText>
            </AppTouchableOpacity>
            <AppTouchableOpacity
              style={styles.keypadBtn}
              onPress={() => setCurrentInput((prev) => prev.slice(0, -1))}
            >
              <Ionicons
                name="backspace-outline"
                size={28}
                color={isDark ? '#fff' : '#333'}
              />
            </AppTouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* 앱 메인 화면 렌더링 영역 */}
      <View
        style={{
          flex: 1,
          display: isUnlocked ? 'flex' : 'none',
          backgroundColor: 'red',
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
              cardStyle: { backgroundColor: isDark ? '#121212' : '#ffffff' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="emotion-select" />
            <Stack.Screen name="diary-list" />
            <Stack.Screen name="diary/[id]" />
            <Stack.Screen
              name="write"
              options={{ presentation: 'fullScreenModal', headerShown: false }}
            />
            <Stack.Screen name="search" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="lock-settings" />
            <Stack.Screen name="language-settings" />
            <Stack.Screen name="theme-settings" />
          </Stack>
        </ThemeProvider>
      </View>
    </>
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
  pinArea: { alignItems: 'center', marginTop: 80 },
  pinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  pinSub: { fontSize: 16, color: '#666', marginBottom: 40 },
  darkText: { color: '#fff' },
  darkSubText: { color: '#aaa' },

  dotContainer: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  darkDot: { borderColor: '#555' },
  dotFilled: { backgroundColor: '#FF6F61', borderColor: '#FF6F61' },
  errorText: { color: 'red', fontSize: 14, height: 20 },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  keypadBtn: {
    width: '30%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
  },
  keypadText: { fontSize: 32, color: '#333', fontWeight: '500' },
});
