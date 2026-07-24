import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SpinnerBgIcon, SpinnerFaceIcon } from '@/assets/icons';

export default function CustomSpinner() {
  // 1. 회전 애니메이션 값 (0 ~ 3)
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // 2. 위아래 움직임 애니메이션 값
  const floatAnim = useRef(new Animated.Value(0)).current;
  // 3. 좌우 움직임 애니메이션 값
  const horizonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 배경 3단계 회전 애니메이션 (0 -> 120도 -> 240도 -> 360도)
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(rotateAnim, {
          toValue: 2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(rotateAnim, {
          toValue: 3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(200),
      ]),
    ).start();

    // 중앙 이미지 위아래 및 좌우 바운스 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: -2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(horizonAnim, {
            toValue: -2,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(horizonAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(horizonAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [rotateAnim, floatAnim, horizonAnim]);

  // rotateAnim의 0, 1, 2, 3 값을 각도(deg)로 매핑
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['0deg', '120deg', '240deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* 1. 배경 회전 이미지 */}
      <Animated.View
        style={[
          styles.backgroundLayer,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <SpinnerBgIcon width={80} height={80} />
      </Animated.View>

      {/* 2. 중앙 둥둥 떠다니는 이미지 */}
      <Animated.View
        style={[
          styles.foregroundLayer,
          {
            transform: [{ translateY: floatAnim }, { translateX: horizonAnim }],
          },
        ]}
      >
        <SpinnerFaceIcon width={55} height={55} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundLayer: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  foregroundLayer: {
    position: 'absolute',
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
