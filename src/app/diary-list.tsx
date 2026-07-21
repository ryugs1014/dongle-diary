import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  useColorScheme,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '@/components/AppText';
import { Stack, router } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { CloseIcon, SearchIcon, OrderIcon } from '../../assets/icons';
import SvgDashedLine from '@/components/SvgDashedLine';
import { EMOTION_IMAGE_MAP } from '@/constants/emotions';
import SortBottomSheet from '@/components/SortBottomSheet';

export default function DiaryListScreen() {
  const { diaries, selectedDate, theme } = useDiaryStore();
  const listRef = useRef<FlatList>(null);

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const sortedDiaries = [...diaries].sort((a, b) => {
    if (sortOrder === 'desc') return b.date.localeCompare(a.date);
    return a.date.localeCompare(b.date);
  });

  const availableYears = Array.from(
    new Set(sortedDiaries.map((d) => d.date.split('-')[0])),
  );
  const hasMultipleYears = availableYears.length > 1;

  const [selectedYear, setSelectedYear] = useState(() => {
    if (sortedDiaries.length > 0) return sortedDiaries[0].date.split('-')[0];
    return '';
  });

  const [isYearModalVisible, setIsYearModalVisible] = useState(false);

  const filteredDiaries = sortedDiaries.filter((d) =>
    d.date.startsWith(selectedYear),
  );

  useEffect(() => {
    if (selectedDate) {
      const targetYear = selectedDate.split('-')[0];
      setSelectedYear((prevYear) => {
        if (prevYear !== targetYear && availableYears.includes(targetYear)) {
          return targetYear;
        }
        return prevYear;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && filteredDiaries.length > 0) {
      const index = filteredDiaries.findIndex((d) => d.date === selectedDate);

      if (index !== -1) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: true });
        }, 200);
      }
    }
  }, [selectedDate, filteredDiaries]);

  const renderFooter = () => {
    if (!hasMultipleYears) return null;
    return (
      <View style={styles.footerContainer}>
        <Text
          useDiaryFont
          style={[styles.footerText, isDark && styles.darkSubText]}
        >
          연도별로 작성한 일기를 찾으시나요?
        </Text>
        <AppTouchableOpacity
          style={styles.footerButton}
          onPress={() => setIsYearModalVisible(true)}
        >
          <Text style={styles.footerButtonText}>다른 년도 보기</Text>
        </AppTouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
            <CloseIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>

          <View style={{ width: 28 }} />
        </View>

        <AppTouchableOpacity
          disabled={availableYears.length === 0}
          onPress={() => setIsYearModalVisible(true)}
          style={styles.headerTitleBtn}
        >
          <AppText
            style={[styles.customHeaderTitle, isDark && { color: 'white' }]}
          >
            {selectedYear}
          </AppText>
        </AppTouchableOpacity>

        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.push('/search')}>
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>
          <AppTouchableOpacity onPress={() => setIsSortModalVisible(true)}>
            <OrderIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={filteredDiaries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListFooterComponent={renderFooter}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 300);
        }}
        ItemSeparatorComponent={() => <SvgDashedLine />}
        renderItem={({ item }) => {
          const itemDateObj = new Date(item.date);
          const itemMonth = itemDateObj.getMonth() + 1;
          const itemDay = itemDateObj.getDate();
          const week = ['일', '월', '화', '수', '목', '금', '토'];
          const itemDayOfWeek = week[itemDateObj.getDay()];

          return (
            <AppTouchableOpacity
              activeOpacity={1}
              style={[styles.card, isDark && styles.darkCard]}
              onPress={() => router.push(`/diary/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.emotionsContainer}>
                  {item.emotions && item.emotions.length > 0 ? (
                    item.emotions.map((emotionId, index) =>
                      EMOTION_IMAGE_MAP[emotionId] ? (
                        <Image
                          key={`${item.id}-${emotionId}-${index}`}
                          source={EMOTION_IMAGE_MAP[emotionId]}
                          style={styles.emotionImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <AppText key={index} style={styles.fallbackEmotionText}>
                          {emotionId}
                        </AppText>
                      ),
                    )
                  ) : item.emotion && EMOTION_IMAGE_MAP[item.emotion] ? (
                    <Image
                      source={EMOTION_IMAGE_MAP[item.emotion]}
                      style={styles.emotionImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <AppText style={styles.fallbackEmotionText}>
                      {item.emotion}
                    </AppText>
                  )}
                </View>

                <View style={styles.dateBox}>
                  <AppText
                    useDiaryFont
                    style={[styles.date]}
                  >{`${itemMonth}월 ${itemDay}일`}</AppText>
                  <AppText
                    useDiaryFont
                    style={[styles.day, isDark && styles.darkSubText]}
                  >
                    {itemDayOfWeek}요일
                  </AppText>
                </View>
              </View>

              {item.title && (
                <AppText useDiaryFont style={[styles.title]}>
                  {item.title}
                </AppText>
              )}

              {/* 신규 에디터 방식(content)과 예전 블록 방식(blocks) 모두 지원 */}
              {item.content !== undefined ? (
                <View>
                  {(() => {
                    const imgMatch = item.content.match(
                      /<img[^>]+src="([^">]+)"/,
                    );
                    const firstImgUrl = imgMatch ? imgMatch[1] : null;
                    const plainText = item.content
                      .replace(/<[^>]*>?/gm, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();

                    return (
                      <>
                        {firstImgUrl && (
                          <Image
                            source={{ uri: firstImgUrl }}
                            style={styles.previewImage}
                          />
                        )}
                        {plainText.length > 0 && (
                          <AppText
                            useDiaryFont
                            style={[
                              styles.content,
                              isDark && styles.darkSubText,
                            ]}
                            numberOfLines={3}
                          >
                            {plainText}
                          </AppText>
                        )}
                      </>
                    );
                  })()}
                </View>
              ) : (
                item.blocks?.map((block) =>
                  block.type === 'image' ? (
                    <Image
                      key={block.id}
                      source={{ uri: block.value }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <AppText
                      key={block.id}
                      style={[styles.content, isDark && styles.darkSubText]}
                      numberOfLines={3}
                    >
                      {block.value}
                    </AppText>
                  ),
                )
              )}
            </AppTouchableOpacity>
          );
        }}
      />

      {/* 연도 선택 모달 */}
      <Modal visible={isYearModalVisible} transparent animationType="fade">
        <AppTouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsYearModalVisible(false)}
        >
          <View
            style={[styles.modalBox, isDark && styles.darkModalBox]}
            onStartShouldSetResponder={() => true}
          >
            <AppText style={[styles.modalTitle, isDark && { color: 'white' }]}>
              년도 선택
            </AppText>
            <View style={styles.yearGrid}>
              {availableYears.map((year) => (
                <AppTouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    isDark && styles.darkYearOption,
                    selectedYear === year && styles.yearOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedYear(year);
                    setIsYearModalVisible(false);

                    setTimeout(() => {
                      listRef.current?.scrollToOffset({
                        offset: 0,
                        animated: true,
                      });
                    }, 100);
                  }}
                >
                  <Text
                    style={[
                      styles.yearOptionText,
                      isDark && { color: 'white' },
                      selectedYear === year && { color: 'white' },
                    ]}
                  >
                    {year}
                  </Text>
                </AppTouchableOpacity>
              ))}
            </View>
          </View>
        </AppTouchableOpacity>
      </Modal>

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
  },
  darkCustomHeader: {
    backgroundColor: '#121212',
  },
  headerTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leftIconsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
  },
  rightIconsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },

  card: {
    paddingVertical: 30,
    elevation: 2,
    gap: 10,
  },
  darkCard: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  emotionsContainer: {
    flexDirection: 'row',
    gap: 4, // 다중 감정 선택 시 이미지 사이 간격
    alignItems: 'center',
  },
  emotionImage: {
    width: 40,
    height: 40,
  },

  fallbackEmotionText: { fontSize: 16 },
  dateBox: { gap: 4 },
  date: { fontSize: 14, lineHeight: 16 },
  day: { fontSize: 14, color: '#666', lineHeight: 16 },
  title: { fontSize: 18 },

  content: { fontSize: 14, lineHeight: 24 },

  darkSubText: { color: '#666' },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    resizeMode: 'cover',
  },

  // Footer (안내 문구 및 버튼) 스타일
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footerButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  footerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Modal 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  darkModalBox: {
    backgroundColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  yearOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    minWidth: 80,
    alignItems: 'center',
  },
  darkYearOption: {
    backgroundColor: '#444',
  },
  yearOptionSelected: {
    backgroundColor: '#FF6F61',
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
