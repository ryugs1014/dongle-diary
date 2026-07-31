import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  useColorScheme,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppTextInput from '@/components/atoms/AppTextInput';
import { useDiaryStore } from '@/store/useDiaryStore';

interface AppPromptModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  cancelText?: string;
  confirmText?: string;
  confirmColor?: string;
  reverseButtons?: boolean;
  closeOnOverlayPress?: boolean;
  centerPlaceholder?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AppPromptModal({
  visible,
  title,
  message,
  value,
  onChangeText,
  placeholder,
  cancelText = '취소',
  confirmText = '확인',
  confirmColor = '#007AFF',
  reverseButtons = false,
  closeOnOverlayPress = true,
  centerPlaceholder = false,
  onCancel,
  onConfirm,
}: AppPromptModalProps) {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const buttons = [
    {
      key: 'cancel',
      text: cancelText,
      color: isDark ? '#ffffff' : '#666666',
      onPress: onCancel,
    },
    {
      key: 'confirm',
      text: confirmText,
      color: confirmColor,
      onPress: onConfirm,
    },
  ];

  const orderedButtons = reverseButtons ? buttons.reverse() : buttons;

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* 🔥 1. 전체 화면 고정 Overlay (키보드 영향 안 받음) */}
      <Pressable
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        onPress={closeOnOverlayPress ? onCancel : undefined}
      />

      {/* 🔥 2. 키보드 회피 영역 (배경 클릭이 통과하도록 pointerEvents="box-none" 추가) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        <View style={styles.alertCenterWrapper} pointerEvents="box-none">
          <Pressable
            style={[styles.alertBox, isDark && styles.darkMenuBox]}
            onPress={(e) => e.stopPropagation()} // 내부 클릭 시 배경 클릭 이벤트(닫힘) 방지
          >
            {title && (
              <AppText style={[styles.alertTitle, isDark && styles.darkText]}>
                {title}
              </AppText>
            )}

            {message && (
              <AppText
                style={[styles.alertMessage, isDark && styles.darkSubText]}
              >
                {message}
              </AppText>
            )}

            <View style={styles.inputContainer}>
              <AppTextInput
                style={[
                  styles.textInput,
                  isDark && styles.darkTextInput,
                  centerPlaceholder && styles.alignCenter,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={isDark ? '#777' : '#999'}
                autoFocus
              />
            </View>

            <View style={[styles.alertButtons, isDark && styles.darkMenuItem]}>
              {orderedButtons.map((btn, index) => (
                <AppTouchableOpacity
                  key={btn.key}
                  style={[
                    styles.alertBtn,
                    index > 0 && {
                      borderLeftWidth: 1,
                      borderColor: isDark ? '#333' : '#eee',
                    },
                  ]}
                  onPress={btn.onPress}
                >
                  <AppText
                    style={[
                      styles.alertBtnText,
                      {
                        color: btn.color,
                        fontWeight: index > 0 ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {btn.text}
                  </AppText>
                </AppTouchableOpacity>
              ))}
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 🔥 추가된 백그라운드 스타일
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  // 🔥 모달을 가운데 정렬하기 위한 래퍼 스타일 (alertOverlay 대체)
  alertCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    marginTop: 100, // 모달을 약간 위로 띄우기 위함
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    paddingTop: 24,
  },
  darkMenuBox: { backgroundColor: '#191919' },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  darkText: { color: '#ffffff' },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  darkSubText: { color: '#aaa' },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    // paddingVertical: 10,
    height: 50,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  darkTextInput: {
    borderColor: '#333',
    color: '#fff',
    backgroundColor: '#121212',
  },
  alignCenter: {
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  darkMenuItem: { borderTopColor: '#333' },
  alertBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  alertBtnText: { fontSize: 16 },
});
