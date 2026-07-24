import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { EMOTIONS_DATA } from '@/constants/emotions';
import { CloseIcon } from '@/assets/icons';
import { NextBigIcon } from '@/components/ui/NextBigIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { SelectBigIcon } from '@/components/ui/SelectBigIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EmotionSelectModalProps {
  visible: boolean;
  onClose: () => void;
  selectedEmotions: string[];
  onToggleEmotion: (id: string) => void;
  onClearEmotions: () => void;
  isDark: boolean;
}

export default function EmotionSelectModal({
  visible,
  onClose,
  selectedEmotions,
  onToggleEmotion,
  onClearEmotions,
  isDark = false,
}: EmotionSelectModalProps) {
  // 애니메이션 처리를 위한 상태와 ref
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // visible 상태가 변할 때마다 슬라이드 애니메이션 실행
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true, // 네이티브 드라이버를 사용해 퍼포먼스 최적화
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // 애니메이션이 완전히 끝난 후 모달 닫기
        setModalVisible(false);
      });
    }
  }, [visible]);

  // 내부 상태와 외부 상태 모두 false일 때만 렌더링을 완전히 중단
  if (!modalVisible && !visible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.emotionBox,
            isDark && styles.darkEmotionBox, // 다크모드 배경
            { transform: [{ translateY }] }, // 슬라이드 효과
          ]}
        >
          <View style={styles.modalHeader}>
            <AppTouchableOpacity onPress={onClose}>
              <CloseIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>

            {selectedEmotions.length > 0 && (
              <AppTouchableOpacity
                onPress={onClearEmotions}
                style={styles.clearBtn}
              >
                <AppText
                  style={[styles.clearText, isDark && styles.darkClearText]}
                >
                  모두 빼기
                </AppText>
              </AppTouchableOpacity>
            )}
          </View>

          <View style={styles.titleWrapper}>
            <AppText style={[styles.title, isDark && styles.darkText]}>
              오늘 하루는 어땠나요?
            </AppText>
          </View>

          <ScrollView
            style={styles.emotionScrollView}
            contentContainerStyle={styles.emotionScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {EMOTIONS_DATA.map((emotion) => {
                // 1. 현재 이모션이 배열의 몇 번째에 있는지 찾습니다.
                const selectedIndex = selectedEmotions.indexOf(emotion.id);

                // 2. 인덱스가 -1이 아니라면 선택된 상태입니다.
                const isSelected = selectedIndex !== -1;

                // const isSelected = selectedEmotions.includes(emotion.id);

                return (
                  <AppTouchableOpacity
                    key={emotion.id}
                    style={[styles.emojiBtn, isSelected && styles.selectedBtn]}
                    onPress={() => onToggleEmotion(emotion.id)}
                  >
                    <Image
                      source={
                        isSelected && emotion.animatedSource
                          ? emotion.animatedSource
                          : emotion.source
                      }
                      style={[
                        styles.modalEmotionImage,
                        isSelected && styles.selectedEmotionImage,
                      ]}
                      contentFit="contain"
                      transition={200}
                    />

                    {isSelected && (
                      <View style={styles.orderBadge}>
                        <AppText style={styles.orderBadgeText}>
                          {selectedIndex + 1}
                        </AppText>
                      </View>
                    )}
                  </AppTouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <LinearGradient
            style={styles.bottomBtnWrapper}
            colors={
              isDark
                ? ['rgba(17, 17, 17, 0)', 'rgba(17, 17, 17, 0.8)', '#111111']
                : [
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.8)',
                    '#FCFBFA',
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.7 }}
          >
            <AppTouchableOpacity
              style={[
                styles.nextBtn,
                selectedEmotions.length === 0 && styles.disabledBtn,
              ]}
              onPress={onClose}
              disabled={selectedEmotions.length === 0}
            >
              <SelectBigIcon
                width={60}
                height={60}
                stroke={
                  selectedEmotions.length === 0
                    ? '#cccccc'
                    : isDark
                      ? '#ffffff'
                      : '#333333'
                }
                fill={
                  selectedEmotions.length === 0
                    ? 'transparent'
                    : isDark
                      ? '#111111'
                      : '#ffffff'
                }
              />
            </AppTouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
    color: '#666',
  },
  darkClearText: {
    color: '#aaaaaa',
  },

  titleWrapper: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  emotionBox: {
    backgroundColor: '#ffffff',
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  darkEmotionBox: {
    backgroundColor: '#191919',
  },

  darkText: {
    color: '#ffffff',
  },

  emotionScrollView: {
    flex: 1, // maxHeight 대신 flex: 1을 주어 80% 높이 내부 확보
    width: '100%',
  },

  emotionScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 230,
    paddingTop: 54,
    paddingBottom: 124,
    marginHorizontal: 'auto',
  },

  emojiBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orderBadge: {
    position: 'absolute',
    top: -6,
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    zIndex: 2,
  },
  orderBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  selectedBtn: {},

  modalEmotionImage: {
    width: 50,
    height: 50,
  },

  selectedEmotionImage: {
    transform: [{ scale: 1.3 }],
  },

  bottomBtnWrapper: {
    position: 'absolute',
    bottom: 0,
    paddingTop: 30,
    paddingBottom: 60,
    width: '100%',
    backgroundColor: 'transparent',
  },

  nextBtn: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0 },
  nextBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});
