import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ToastConfigParams } from 'react-native-toast-message';
import AppText from '@/components/atoms/AppText';
import {
  AlertSuccessIcon,
  AlertErrorIcon,
  AlertWarningIcon,
  AlertInfoIcon,
} from '@/assets/icons';

const BaseToast = ({
  text1,
  icon,
  isDark,
}: {
  text1?: string;
  icon: React.ReactNode;
  isDark: boolean;
}) => (
  <View
    style={[
      styles.toastContainer,
      isDark ? styles.darkToast : styles.lightToast,
    ]}
  >
    {icon}
    <View style={styles.toastTextWrapper}>
      <AppText
        style={[styles.toastText1, isDark ? styles.darkText : styles.lightText]}
      >
        {text1}
      </AppText>
    </View>
  </View>
);

// _layout.tsx에서 isDark 상태를 받아 config 객체를 생성하는 함수
export const getToastConfig = (isDark: boolean) => ({
  success: ({ text1 }: ToastConfigParams<any>) => (
    <BaseToast
      text1={text1}
      icon={<AlertSuccessIcon width={28} height={28} />}
      isDark={isDark}
    />
  ),
  error: ({ text1 }: ToastConfigParams<any>) => (
    <BaseToast
      text1={text1}
      icon={<AlertErrorIcon width={28} height={28} />}
      isDark={isDark}
    />
  ),
  warn: ({ text1 }: ToastConfigParams<any>) => (
    <BaseToast
      text1={text1}
      icon={<AlertWarningIcon width={28} height={28} />}
      isDark={isDark}
    />
  ),
  info: ({ text1 }: ToastConfigParams<any>) => (
    <BaseToast
      text1={text1}
      icon={<AlertInfoIcon width={28} height={28} />}
      isDark={isDark}
    />
  ),
});

const styles = StyleSheet.create({
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
    // zIndex: 9999,
  },
  lightToast: { backgroundColor: '#393939' },
  darkToast: { backgroundColor: '#202020' },
  toastTextWrapper: { marginLeft: 12, flex: 1 },
  toastText1: { fontSize: 16, lineHeight: 24 },
  lightText: { color: '#ffffff' },
  darkText: { color: '#ffffff' },
});
