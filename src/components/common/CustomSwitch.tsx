import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  isDark?: boolean;
}

export default function CustomSwitch({
  value,
  onValueChange,
  disabled = false,
  isDark,
}: CustomSwitchProps) {
  // 토글 위치 애니메이션 (0: 꺼짐, 1: 켜짐)
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false, // 배경색 애니메이션을 위해 false로 설정
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18], // 노브 이동 범위
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['#333333', '#ffffff'] // 다크 모드: 꺼짐(#333), 켜짐(흰색)
      : ['#E0E0E0', '#111111'], // 라이트 모드: 꺼짐(회색), 켜짐(메인 산호색)
  });

  return (
    <AppTouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.switchContainer, disabled && { opacity: 0.4 }]}
    >
      <Animated.View style={[styles.switchTrack, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.switchKnob,
            {
              transform: [{ translateX }],
              // 노브 색상도 테마에 따라 분기
              backgroundColor: isDark ? '#111111' : '#ffffff',
            },
          ]}
        />
      </Animated.View>
    </AppTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    padding: 2,
  },
  switchTrack: {
    width: 36,
    height: 20,
    borderRadius: 14,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 16,
    height: 16,
    borderRadius: 50,
    // elevation: 3,
  },
});
