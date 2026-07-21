import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Modal } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { router } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon, SearchIcon, OrderIcon } from '../../assets/icons';
import SvgDashedLine from '@/components/SvgDashedLine';
import { EMOTION_IMAGE_MAP } from '@/constants/emotions';
import SortBottomSheet from '@/components/SortBottomSheet';

interface DiaryListViewProps {
  isDark: boolean;
  t: (ko: string, en: string) => string;
  onGoBack: () => void;
}

export default function DiaryListView({
  isDark,
  t,
  onGoBack,
}: DiaryListViewProps) {
  const { diaries, selectedDate } = useDiaryStore();
  const listRef = useRef<FlatList>(null);

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // 1. 전체 일기를 최신순으로 정렬
  const sortedDiaries = [...diaries].sort((a, b) => {
    if (sortOrder === 'desc') return b.date.localeCompare(a.date);
    return a.date.localeCompare(b.date);
  });

  // 2. 작성된 일기들의 '연도'만 중복 없이 추출
  const availableYears = Array.from(
    new Set(sortedDiaries.map((d) => d.date.split('-')[0])),
  );
  const hasMultipleYears = availableYears.length > 1;

  // 3. 현재 선택된 연도 상태 (기본값: 가장 최신 일기의 연도, 일기가 없으면 공백)
  const [selectedYear, setSelectedYear] = useState(() => {
    if (sortedDiaries.length > 0) return sortedDiaries[0].date.split('-')[0];
    return '';
  });

  // 4. 연도 선택 모달 표시 여부
  const [isYearModalVisible, setIsYearModalVisible] = useState(false);

  // 5. 선택된 연도의 일기만 필터링
  const filteredDiaries = sortedDiaries.filter((d) =>
    d.date.startsWith(selectedYear),
  );

  // 달력에서 선택한 날짜(selectedDate)가 바뀔 때"만" 해당 연도로 자동 전환하도록 수정
  useEffect(() => {
    if (selectedDate) {
      const targetYear = selectedDate.split('-')[0];
      // setState 안에서 이전 값(prevYear)을 비교하여 무한 루프 및 강제 복구 방지
      setSelectedYear((prevYear) => {
        if (prevYear !== targetYear && availableYears.includes(targetYear)) {
          return targetYear;
        }
        return prevYear;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const renderFooter = () => {
    if (!hasMultipleYears) return null; // 연도가 1개 이하면 표시하지 않음
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
    <View style={styles.container}>
      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={onGoBack}>
            <BackIcon
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
        // 스크롤 에러 방지용 방어 코드
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

              {item.content ? (
                // 1. 신규 데이터: HTML(content) 문자열 기반 렌더링
                <View>
                  {(() => {
                    // 첫 번째 이미지 URL 추출
                    const imgMatch = item.content.match(
                      /<img[^>]+src="([^">]+)"/,
                    );
                    const firstImgUrl = imgMatch ? imgMatch[1] : null;

                    // HTML 태그 제거하여 순수 텍스트 추출 (줄바꿈은 띄어쓰기로 치환)
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
                // 2. 과거 데이터: 배열(blocks) 기반 렌더링 (하위 호환성 유지)
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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
    gap: 4,
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
