import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from 'react-native';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore } from '../store/useDiaryStore';
import { useFonts } from 'expo-font';

// 앱에 적용할 서체 목록
const FONTS = [
  // { id: 'System', label: '시스템 기본 서체' },
  { id: 'NanumSquareRound', label: '나눔스퀘어라운드' },
  { id: 'KyoboHandwriting', label: '교보문고 손글씨' },
  { id: 'GowunBatang', label: '고운바탕' },
  { id: 'IsYun', label: '이서윤체' },
];

// 1~5단계에 따른 실제 글꼴 픽셀(px) 매핑
const FONT_SIZES = {
  1: 10,
  2: 12,
  3: 14, // 기본값
  4: 16,
  5: 18,
};

export default function FontSettingsScreen() {
  const {
    diaryFontSize,
    diaryFontFamily,
    setDiaryFontSize,
    setDiaryFontFamily,
    theme,
  } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // 현재 선택된 단계의 실제 사이즈
  const currentSizePx = FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES];

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.darkContainer]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{ headerTitle: '글꼴 및 크기', headerBackTitle: '설정' }}
      />

      <ScrollView>
        {/* 💡 1. 미리보기 영역 */}
        <View style={styles.previewContainer}>
          <AppText style={styles.previewLabel}>미리보기</AppText>
          <View style={[styles.previewBox, isDark && styles.darkPreviewBox]}>
            <Text
              style={{
                fontSize: currentSizePx,
                fontFamily: diaryFontFamily,
                color: isDark ? '#fff' : '#333',
                lineHeight: currentSizePx * 1.5, // 줄간격도 글자 크기에 맞춰 조정
              }}
            >
              오늘은 정말 기분 좋은 하루였다.{'\n'}
              다람쥐 헌 쳇바퀴에 타고파.
            </Text>
          </View>
        </View>

        {/* 💡 2. 글자 크기 5단계 설정 (Slider 대신 직관적인 버튼 방식) */}
        <View style={[styles.section, isDark && styles.darkSection]}>
          <AppText style={[styles.sectionTitle, isDark && styles.darkSubText]}>
            일기 글자 크기 ({diaryFontSize}단계)
          </AppText>
          <View style={styles.sizeController}>
            <TouchableOpacity
              onPress={() => setDiaryFontSize(Math.max(1, diaryFontSize - 1))}
            >
              <Ionicons
                name="remove-circle-outline"
                size={36}
                color={diaryFontSize === 1 ? '#ccc' : '#FF6F61'}
              />
            </TouchableOpacity>

            <View style={styles.dotsContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.dot,
                    diaryFontSize >= level && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setDiaryFontSize(Math.min(5, diaryFontSize + 1))}
            >
              <Ionicons
                name="add-circle-outline"
                size={36}
                color={diaryFontSize === 5 ? '#ccc' : '#FF6F61'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 💡 3. 글꼴 선택기 */}
        <View
          style={[
            styles.section,
            isDark && styles.darkSection,
            { marginTop: 20 },
          ]}
        >
          <AppText style={[styles.sectionTitle, isDark && styles.darkSubText]}>
            서체 변경
          </AppText>
          {FONTS.map((font, index) => (
            <TouchableOpacity
              key={font.id}
              style={[
                styles.fontItem,
                index !== FONTS.length - 1 && styles.borderBottom,
                isDark && styles.darkBorder,
              ]}
              onPress={() => setDiaryFontFamily(font.id)}
            >
              <Text
                style={[
                  styles.fontText,
                  isDark && styles.darkText,
                  {
                    fontFamily: font.id,
                  },
                ]}
              >
                {font.label}
              </Text>
              {diaryFontFamily === font.id && (
                <Ionicons name="checkmark" size={24} color="#FF6F61" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#121212' },

  previewContainer: { padding: 20 },
  previewLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
  },
  previewBox: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    minHeight: 150,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  darkPreviewBox: { backgroundColor: '#1e1e1e' },

  section: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  darkSection: { backgroundColor: '#1e1e1e', borderColor: '#333' },
  sectionTitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  darkSubText: { color: '#aaa' },

  sizeController: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  dotsContainer: { flexDirection: 'row', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#eee' },
  activeDot: { backgroundColor: '#FF6F61' },

  fontItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  darkBorder: { borderBottomColor: '#2c2c2e' },
  fontText: { fontSize: 16, color: '#333' },
  darkText: { color: '#fff' },
});
