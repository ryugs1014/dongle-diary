import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import AppTextInput from '@/components/AppTextInput';
import AppText from '@/components/AppText';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore } from '../store/useDiaryStore';

export default function SearchScreen() {
  const { diaries, theme } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [searchText, setSearchText] = useState('');
  const [submittedText, setSubmittedText] = useState('');

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 750);

    return () => clearTimeout(focusTimeout);
  }, []);

  // 💡 검색 로직 업데이트: 신규 에디터(content), 제목(title), 과거 블록(blocks) 모두 검색
  const filteredDiaries = diaries.filter((diary) => {
    if (submittedText.trim() === '') return false;

    const term = submittedText.toLowerCase();

    // 1. 날짜로 검색
    if (diary.date.includes(term)) return true;

    // 2. 제목으로 검색
    if (diary.title && diary.title.toLowerCase().includes(term)) return true;

    // 3. 신규 에디터 방식 (content) 본문 검색 - HTML 태그 제거 후 텍스트만 비교
    if (diary.content) {
      const plainText = diary.content.replace(/<[^>]*>?/gm, ' ').toLowerCase();
      if (plainText.includes(term)) return true;
    }
    // 4. 과거 데이터 방식 (blocks) 본문 검색
    else if (diary.blocks) {
      return diary.blocks.some(
        (block) =>
          block.type === 'text' && block.value.toLowerCase().includes(term),
      );
    }

    return false;
  });

  const handleClear = () => {
    setSearchText('');
    setSubmittedText(''); // 검색 결과 초기화
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = () => {
    setSubmittedText(searchText);
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Stack.Screen
        options={{ headerTitle: '일기 검색', headerBackTitle: '뒤로' }}
      />

      <View style={styles.searchRow}>
        <View
          style={[styles.searchContainer, isDark && styles.darkSearchContainer]}
        >
          <Ionicons name="search" size={20} color={isDark ? '#aaa' : '#888'} />
          <AppTextInput
            ref={searchInputRef}
            style={[styles.searchInput, isDark && styles.darkText]}
            placeholder="검색어 또는 날짜 입력"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? '#aaa' : '#888'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 💡 검색하기 버튼 추가 */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSearchSubmit}>
          <AppText style={styles.submitBtnText}>검색</AppText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDiaries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 15 }}
        ListEmptyComponent={
          submittedText.trim() !== '' ? (
            <AppText style={[styles.emptyText, isDark && styles.darkSubText]}>
              '{submittedText}'에 대한 검색 결과가 없습니다.
            </AppText>
          ) : (
            <AppText style={[styles.emptyText, isDark && styles.darkSubText]}>
              검색어를 입력하고 검색을 눌러주세요.
            </AppText>
          )
        }
        renderItem={({ item }) => {
          // 💡 다중 감정 호환 처리
          const displayEmotion =
            item.emotions && item.emotions.length > 0
              ? item.emotions.join(' ')
              : item.emotion || '📝';

          // 💡 본문 미리보기 추출 로직 (HTML 태그 제거)
          let previewText = '사진이 있는 일기';
          if (item.content) {
            const plainContent = item.content
              .replace(/<[^>]*>?/gm, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (plainContent) previewText = plainContent;
          } else if (item.blocks) {
            const textBlock = item.blocks.find((b) => b.type === 'text');
            if (textBlock) previewText = textBlock.value;
          }

          return (
            <TouchableOpacity
              style={[styles.card, isDark && styles.darkCard]}
              onPress={() => router.push(`/diary/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <AppText style={styles.emotion}>{displayEmotion}</AppText>
                <AppText style={[styles.date, isDark && styles.darkSubText]}>
                  {item.date}
                </AppText>
              </View>

              {item.title && (
                <AppText style={[styles.title, isDark && styles.darkText]}>
                  {item.title}
                </AppText>
              )}

              <AppText
                style={[styles.content, isDark && styles.darkSubText]}
                numberOfLines={2}
              >
                {previewText}
              </AppText>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#111111' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  darkSearchContainer: { backgroundColor: '#1e1e1e' },

  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  darkText: { color: '#fff' },
  darkSubText: { color: '#aaa' },

  clearBtn: { padding: 5 },

  submitBtn: {
    backgroundColor: '#FF6F61',
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },

  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  darkCard: { backgroundColor: '#1e1e1e' },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  emotion: { fontSize: 24 },
  date: { fontSize: 14, color: '#666', fontWeight: '500' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  content: { fontSize: 15, color: '#333', lineHeight: 22 },
});
