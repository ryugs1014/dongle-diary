// components/NumberKeypad.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { EditIcon, FingerIcon } from '@/assets/icons';

interface NumberKeypadProps {
  onNumberPress: (num: string) => void;
  onDeletePress: () => void;
  onBiometricPress?: () => void;
  showBiometric?: boolean;
  isDark?: boolean;
}

export default function NumberKeypad({
  onNumberPress,
  onDeletePress,
  onBiometricPress,
  showBiometric = false,
  isDark = false,
}: NumberKeypadProps) {
  return (
    <View style={styles.keypadContainer}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
        <AppTouchableOpacity
          key={num}
          style={styles.keypadBtn}
          onPressIn={() => onNumberPress(num)}
        >
          <AppText style={[styles.keypadText, isDark && styles.darkText]}>
            {num}
          </AppText>
        </AppTouchableOpacity>
      ))}

      {/* 좌측 하단: 생체 인식 버튼 또는 빈 공간 */}
      {showBiometric ? (
        <AppTouchableOpacity
          style={styles.keypadBtn}
          onPress={onBiometricPress}
          disabled={!onBiometricPress}
        >
          <FingerIcon width={40} height={40} color={isDark ? '#666' : '#ccc'} />
        </AppTouchableOpacity>
      ) : (
        <View style={styles.keypadBtn} />
      )}

      {/* 중앙 하단: 0 */}
      <AppTouchableOpacity
        style={styles.keypadBtn}
        onPressIn={() => onNumberPress('0')}
      >
        <AppText style={[styles.keypadText, isDark && styles.darkText]}>
          0
        </AppText>
      </AppTouchableOpacity>

      {/* 우측 하단: 지우기 */}
      <AppTouchableOpacity
        activeOpacity={1}
        style={styles.keypadBtn}
        onPressIn={onDeletePress}
      >
        <EditIcon width={28} height={28} color={isDark ? '#666' : '#ccc'} />
      </AppTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  keypadBtn: {
    width: '30%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
  },
  keypadText: {
    fontSize: 24,
  },

  darkText: {
    color: '#ffffff',
  },
});
