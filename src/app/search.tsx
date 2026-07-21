import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  ScrollView,
  useColorScheme,
  Keyboard,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppTextInput from '@/components/AppTextInput';
import AppText from '@/components/AppText';
import { Stack, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  OrderIcon,
  SearchIcon,
  DeleteIcon,
  BackIcon,
} from '../../assets/icons';
import SvgDashedLine from '@/components/SvgDashedLine';
import { EMOTIONS_DATA } from '@/constants/emotions';
import DiaryCard from '@/components/DiaryCard';
import SortBottomSheet from '@/components/SortBottomSheet';

export default function SearchScreen() {
  const { diaries, theme } = useDiaryStore();
  const navigation = useNavigation();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [searchText, setSearchText] = useState('');
  const [submittedText, setSubmittedText] = useState('');

  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const isBackAllowed = useRef(false);
  const isSortAllowed = useRef(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });

    const allowBackTimer = setTimeout(() => {
      isBackAllowed.current = true;
      navigation.setOptions({ gestureEnabled: true });
    }, 1000);

    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 750);

    const allowSortTimer = setTimeout(() => {
      isSortAllowed.current = true;
    }, 1000);

    return () => {
      clearTimeout(allowBackTimer);
      clearTimeout(focusTimeout);
      clearTimeout(allowSortTimer);
    };
  }, [navigation]);

  const toggleEmotion = (id: string) => {
    if (selectedEmotions.includes(id)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== id));
    } else {
      setSelectedEmotions([...selectedEmotions, id]);
    }
  };

  const isSearchActive =
    submittedText.trim() !== '' || selectedEmotions.length > 0;

  const filteredDiaries = isSearchActive
    ? diaries
        .filter((diary) => {
          let textMatch = true;
          if (submittedText.trim() !== '') {
            const term = submittedText.toLowerCase();

            const termNoSpace = term.replace(/\s+/g, '');
            const [year, month, day] = diary.date.split('-');
            const m = parseInt(month, 10);
            const d = parseInt(day, 10);

            const dateFormats = [
              diary.date,
              diary.date.replace(/-/g, ''),
              `${year}년${m}월${d}일`,
              `${m}월${d}일`,
              `${month}월${day}일`,
            ];

            const matchDate = dateFormats.some((df) =>
              df.includes(termNoSpace),
            );

            const matchTitle =
              diary.title && diary.title.toLowerCase().includes(term);
            const matchContent =
              diary.content &&
              diary.content
                .replace(/<[^>]*>?/gm, ' ')
                .toLowerCase()
                .includes(term);
            const matchBlocks =
              diary.blocks &&
              diary.blocks.some(
                (block) =>
                  block.type === 'text' &&
                  block.value.toLowerCase().includes(term),
              );

            if (!matchDate && !matchTitle && !matchContent && !matchBlocks) {
              textMatch = false;
            }
          }

          let emotionMatch = true;
          if (selectedEmotions.length > 0) {
            const diaryEmotions =
              diary.emotions || (diary.emotion ? [diary.emotion] : []);
            emotionMatch = selectedEmotions.some((e) =>
              diaryEmotions.includes(e),
            );
          }

          return textMatch && emotionMatch;
        })
        .sort((a, b) => {
          if (sortOrder === 'desc') return b.date.localeCompare(a.date);
          return a.date.localeCompare(b.date);
        })
    : [];

  const handleClear = () => {
    setSearchText('');
    setSubmittedText('');
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = () => {
    setSubmittedText(searchText);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity
            onPress={() => {
              if (!isBackAllowed.current) return;
              router.back();
            }}
          >
            <BackIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              isDark && styles.darkSearchContainer,
            ]}
          >
            <AppTextInput
              ref={searchInputRef}
              style={[styles.searchInput, isDark && styles.darkText]}
              placeholder="일기 또는 날짜 검색"
              placeholderTextColor={isDark ? '#666' : '#999'}
              cursorColor={isDark ? '#fff' : '#000'}
              selectionColor={isDark ? '#fff' : '#000'}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
            />
            {searchText.length > 0 && (
              <AppTouchableOpacity
                onPress={handleClear}
                style={styles.clearBtn}
              >
                <DeleteIcon
                  width={24}
                  height={24}
                  color={isDark ? 'white' : 'black'}
                />
              </AppTouchableOpacity>
            )}
          </View>

          <AppTouchableOpacity
            style={styles.submitBtn}
            onPress={handleSearchSubmit}
          >
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>

          <AppTouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              if (!isSortAllowed.current) return;
              setIsSortModalVisible(true);
            }}
          >
            <OrderIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <AppText style={[styles.emotionFilterTitle, isDark && styles.darkText]}>
        감정 골라보기
      </AppText>

      <View style={styles.emotionFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emotionFilterScroll}
        >
          {EMOTIONS_DATA.map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion.id);
            return (
              <AppTouchableOpacity
                key={emotion.id}
                style={[
                  styles.emotionChip,
                  isSelected && styles.emotionChipSelected,
                  isDark && !isSelected && styles.darkEmotionChip,
                ]}
                onPress={() => toggleEmotion(emotion.id)}
              >
                <Image
                  source={
                    isSelected && emotion.animatedSource
                      ? emotion.animatedSource
                      : emotion.source
                  }
                  style={[
                    styles.chipEmotionImage,
                    isSelected && styles.selectedEmotionImage,
                  ]}
                  contentFit="contain"
                />
              </AppTouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDiaries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <SvgDashedLine />}
        ListEmptyComponent={
          isSearchActive ? (
            <AppText style={[styles.emptyText, isDark && styles.darkSubText]}>
              검색 조건에 맞는 일기가 없습니다.
            </AppText>
          ) : null
        }
        renderItem={({ item }) => <DiaryCard item={item} />}
      />

      <SortBottomSheet
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(33, 37, 41, 0.2)',
  },
  darkCustomHeader: {
    backgroundColor: '#121212',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
  },

  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, lineHeight: 16 },
  darkText: { color: '#fff' },
  darkSubText: { color: '#aaa' },
  clearBtn: { padding: 5 },
  submitBtn: { justifyContent: 'center', alignItems: 'center' },
  filterBtn: { justifyContent: 'center', alignItems: 'center' },

  emotionFilterTitle: { fontSize: 14, paddingHorizontal: 20, paddingTop: 20 },
  emotionFilterWrapper: { height: 60 },
  emotionFilterScroll: { paddingHorizontal: 20, gap: 10 },
  emotionChip: { flexDirection: 'row', alignItems: 'center' },
  chipEmotionImage: { width: 40, height: 40 },
  selectedEmotionImage: { transform: [{ scale: 1.3 }] },

  emptyText: { textAlign: 'center', color: '#888', marginTop: 60 },
});
