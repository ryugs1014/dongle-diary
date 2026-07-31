import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Animated, useColorScheme, View } from 'react-native';
import AppText from '@/components/atoms/AppText';
import { useDiaryStore } from '@/store/useDiaryStore';
import { AlertInfoIcon } from '@/assets/icons';

export interface AppToastRef {
  show: (message: string) => void;
}

const AppToast = forwardRef<AppToastRef>((props, ref) => {
  // 전역 스토어에서 다크모드 여부 가져오기 (외부에서 props로 안 넘겨줘도 됨)
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20)); // 위에서 아래로 떨어지는 애니메이션

  useImperativeHandle(ref, () => ({
    show: (msg: string) => {
      setToastMessage(msg);

      // 나타날 때
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // 1.5초 뒤 사라질 때
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToastMessage(null);
        });
      }, 1500);
    },
  }));

  if (!toastMessage) return null;

  return (
    <Animated.View
      style={[
        styles.customToastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.toastContainer,
          isDark ? styles.darkToast : styles.lightToast,
        ]}
      >
        <AlertInfoIcon width={28} height={28} />

        <View style={styles.toastTextWrapper}>
          <AppText
            style={[
              styles.toastText1,
              isDark ? styles.darkText : styles.lightText,
            ]}
          >
            {toastMessage}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
});

export default AppToast;

const styles = StyleSheet.create({
  darkText: { color: '#ffffff' },
  customToastContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 999999,
    flex: 1,
    width: '90%',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // elevation: 5,
    // zIndex: 9999,
  },
  lightToast: { backgroundColor: '#393939' },
  darkToast: { backgroundColor: '#202020' },
  toastTextWrapper: { marginLeft: 12, flex: 1 },
  toastText1: { fontSize: 16, lineHeight: 24 },
  lightText: { color: '#ffffff' },
});
