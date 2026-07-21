import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '@/components/AppText';
import { Stack, router } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon } from '../../assets/icons';
import { NextBigIcon } from '@/components/NextBigIcon';
import { EMOTIONS_DATA } from '@/constants/emotions';

export default function EmotionSelectScreen() {
  // 💡 단수(selectedEmotion) 대신 다중 선택이 가능한 배열(selectedEmotions)을 사용합니다.
  const { selectedEmotions, setSelectedEmotions, theme } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  useEffect(() => {
    // 페이지 진입 시 감정 상태를 빈 배열로 깔끔하게 초기화합니다.
    setSelectedEmotions([]);
  }, []);

  const handleEmotionToggle = (id: string) => {
    if (selectedEmotions.includes(id)) {
      // 이미 선택된 감정을 다시 누르면 해제
      setSelectedEmotions(selectedEmotions.filter((e) => e !== id));
    } else {
      if (selectedEmotions.length >= 4) {
        // 💡 4개를 이미 선택한 상태에서 새로운 감정을 누르면, 경고창 없이 4번째 감정을 교체합니다.
        const newEmotions = [...selectedEmotions];
        newEmotions[3] = id;
        setSelectedEmotions(newEmotions);
      } else {
        // 4개 미만일 때는 자연스럽게 추가
        setSelectedEmotions([...selectedEmotions, id]);
      }
    }
  };

  const handleNext = () => {
    if (selectedEmotions.length > 0) {
      router.push('/write');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon width={28} height={28} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>

        <View style={styles.rightIconsWrapper}></View>
      </View>

      <View style={styles.titleWrapper}>
        <AppText style={[styles.title, isDark && styles.darkText]}>
          오늘 하루는 어땠나요?
        </AppText>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {EMOTIONS_DATA.map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion.id);
            return (
              <View key={emotion.id} style={styles.gridItem}>
                <TouchableOpacity
                  style={[styles.emojiBtn, isSelected && styles.selectedBtn]}
                  onPress={() => handleEmotionToggle(emotion.id)}
                >
                  {/* 💡 텍스트 대신 이미지를 렌더링합니다. */}
                  <Image
                    source={emotion.source}
                    style={styles.emotionImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 💡 감정이 1개도 선택되지 않으면 버튼을 비활성화합니다 (경고창 X) */}
      {/*<View style={styles.bottomBtnWrapper}>*/}
      <LinearGradient
        style={styles.bottomBtnWrapper}
        colors={
          isDark
            ? ['rgba(17, 17, 17, 0)', 'rgba(17, 17, 17, 0.8)', '#111'] // 다크모드 그라데이션
            : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)', '#ffffff'] // 라이트모드 그라데이션
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      >
        <TouchableOpacity
          style={[
            styles.nextBtn,
            selectedEmotions.length === 0 && styles.disabledBtn,
          ]}
          onPress={handleNext}
          disabled={selectedEmotions.length === 0}
        >
          <NextBigIcon
            width={60}
            height={60}
            stroke={
              selectedEmotions.length === 0
                ? '#cccccc'
                : isDark
                  ? 'white'
                  : 'black'
            }
            fill={
              selectedEmotions.length === 0
                ? 'transparent'
                : isDark
                  ? 'black'
                  : 'white'
            }
          />
        </TouchableOpacity>
      </LinearGradient>
      {/*</View>*/}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   padding: 20,
  //   backgroundColor: '#fff',
  //   alignItems: 'center',
  // },

  container: { flex: 1, backgroundColor: '#ffffff' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: {
    backgroundColor: '#121212',
  },

  // 💡 새롭게 추가된 제목 감싸개 영역 (가운데 정렬 및 여백 조정)
  titleWrapper: {
    alignItems: 'center',
    paddingTop: 60, // 스크롤 영역과의 간격
    paddingBottom: 30, // 스크롤 영역과의 간격
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // 💡 ScrollView가 남은 공간을 꽉 채우도록 flex: 1 부여
  scrollArea: {
    flex: 1,
  },

  // 💡 내용물 정렬 및 패딩 적용
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 40, // 스크롤 시 맨 밑 감정이 버튼에 가려지지 않게 여유 공간 확보
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 230,
    paddingTop: 54,
    paddingBottom: 124,
  },

  // 💡 새롭게 추가된 스타일: 1줄에 무조건 3개(33.33%)가 들어가도록 강제
  gridItem: {},

  emojiBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    // backgroundColor: '#f0f0f0',
  },

  emotionImage: {
    width: 50,
    height: 50,
  },

  selectedBtn: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  emojiText: { fontSize: 32 },
  // 💡 하단 버튼을 감싸는 영역 추가 (좌우 여백 확보용)
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
  nextBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
