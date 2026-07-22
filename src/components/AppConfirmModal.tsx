// components/AppConfirmModal.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  useColorScheme,
  Pressable,
} from 'react-native';
import AppText from '@/components/AppText';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import { useDiaryStore } from '@/store/useDiaryStore';

interface AppConfirmModalProps {
  visible: boolean;
  title?: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  confirmColor?: string;
  reverseButtons?: boolean;
  closeOnOverlayPress?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AppConfirmModal({
  visible,
  title,
  message,
  cancelText = '취소',
  confirmText = '확인',
  confirmColor = '#007AFF',
  reverseButtons = false,
  closeOnOverlayPress = true,
  onCancel,
  onConfirm,
}: AppConfirmModalProps) {
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
      isConfirm: false,
    },
    {
      key: 'confirm',
      text: confirmText,
      color: confirmColor,
      onPress: onConfirm,
      isConfirm: true,
    },
  ];

  const orderedButtons = reverseButtons ? buttons.reverse() : buttons;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={styles.alertOverlay}
        onPress={closeOnOverlayPress ? onCancel : undefined}
      >
        <Pressable
          style={[styles.alertBox, isDark && styles.darkMenuBox]}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <AppText style={[styles.alertTitle, isDark && styles.darkText]}>
              {title}
            </AppText>
          )}

          <AppText style={[styles.alertMessage, isDark && styles.darkSubText]}>
            {message}
          </AppText>

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
                <AppText style={[styles.alertBtnText, { color: btn.color }]}>
                  {btn.text}
                </AppText>
              </AppTouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    paddingTop: 24,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  darkText: { color: '#ffffff' },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  darkSubText: { color: '#aaa' },
  alertButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  darkMenuItem: { borderTopColor: '#333' },
  alertBtn: { flex: 1, paddingVertical: 20, alignItems: 'center' },
  alertBtnText: { fontSize: 16, color: '#007AFF' },
});
