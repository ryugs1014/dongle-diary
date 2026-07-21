import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '@/components/AppText';
import { Stack, router } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon } from '../../assets/icons';
import { NextBigIcon } from '@/components/NextBigIcon';
import { EMOTIONS_DATA } from '@/constants/emotions';
import { Image } from 'expo-image';

export default function EmotionSelectScreen() {
  const { selectedEmotions, setSelectedEmotions, theme } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  useEffect(() => {
    setSelectedEmotions([]);
  }, []);

  const handleEmotionToggle = (id: string) => {
    if (selectedEmotions.includes(id)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== id));
    } else {
      if (selectedEmotions.length >= 4) {
        const newEmotions = [...selectedEmotions];
        newEmotions[3] = id;
        setSelectedEmotions(newEmotions);
      } else {
        // 4개 미만일 때 자연스럽게 추가
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
        <AppTouchableOpacity onPress={() => router.back()}>
          <BackIcon width={28} height={28} color={isDark ? 'white' : 'black'} />
        </AppTouchableOpacity>

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
                <AppTouchableOpacity
                  style={[styles.emojiBtn, isSelected && styles.selectedBtn]}
                  onPress={() => handleEmotionToggle(emotion.id)}
                >
                  <Image
                    source={
                      isSelected && emotion.animatedSource
                        ? emotion.animatedSource
                        : emotion.source
                    }
                    style={[
                      styles.emotionImage,
                      isSelected && styles.selectedEmotionImage,
                    ]}
                    contentFit="contain"
                    transition={200}
                  />
                </AppTouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <LinearGradient
        style={styles.bottomBtnWrapper}
        colors={
          isDark
            ? ['rgba(17, 17, 17, 0)', 'rgba(17, 17, 17, 0.8)', '#111']
            : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)', '#ffffff']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      >
        <AppTouchableOpacity
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
        </AppTouchableOpacity>
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

  titleWrapper: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
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
  },

  gridItem: {},

  emojiBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f0f0f0',
  },

  emotionImage: {
    width: 50,
    height: 50,
  },

  selectedEmotionImage: {
    transform: [{ scale: 1.3 }],
  },

  selectedBtn: {
    // backgroundColor: '#FFD700',
    // borderWidth: 2,
    // borderColor: '#FFA500',
  },
  emojiText: { fontSize: 32 },
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
