import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Modal } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { router } from 'expo-router';
import { useDiaryStore } from '../../store/useDiaryStore';
import {
  BackIcon,
  SearchIcon,
  OrderIcon,
  EmptyEmotionIcon,
} from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import { EMOTION_IMAGE_MAP } from '@/constants/emotions';
import SortBottomSheet from '@/components/modals/SortBottomSheet';
import YearPickerModal from '@/components/modals/YearPickerModal';

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
      <View style={styles.emptyContainer}>
        <AppText style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          연도별로 일기를 볼 수 있어요{'\n'}지난날의 소중한 하루하루를
          읽어보세요
        </AppText>

        <AppTouchableOpacity
          style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
          onPress={() => setIsYearModalVisible(true)}
        >
          <AppText
            style={[
              styles.emptyButtonText,
              isDark && styles.emptyButtonTextDark,
            ]}
          >
            연도별 일기 보기
          </AppText>
        </AppTouchableOpacity>
      </View>
    );
  };

  const handleGoToWrite = () => {
    onGoBack();

    // 뒤로가기 애니메이션이 끝날 즈음 모달 띄우기
    setTimeout(() => {
      router.push('/emotion-select');
    }, 300);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={onGoBack}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
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
            style={[styles.customHeaderTitle, isDark && { color: '#ffffff' }]}
          >
            {selectedYear}
          </AppText>
        </AppTouchableOpacity>

        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.push('/search')}>
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
          <AppTouchableOpacity onPress={() => setIsSortModalVisible(true)}>
            <OrderIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={filteredDiaries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyEmotionIcon
              width={80}
              height={80}
              color={isDark ? '#888' : '#666'}
            />

            <AppText style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              작성한 일기가 없어요{'\n'}지나간 오늘 하루, 어떤 일이 있었나요?
            </AppText>

            <AppTouchableOpacity
              style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
              onPress={handleGoToWrite}
            >
              <AppText
                style={[
                  styles.emptyButtonText,
                  isDark && styles.emptyButtonTextDark,
                ]}
              >
                오늘 하루 기록하기
              </AppText>
            </AppTouchableOpacity>
          </View>
        }

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
                        {plainText.length > 0 && (
                          <AppText
                            useDiaryFont
                            useDiarySize
                            style={[
                              styles.content,
                              // isDark && styles.darkSubText,
                            ]}
                            numberOfLines={3}
                          >
                            {plainText}
                          </AppText>
                        )}

                        {firstImgUrl && (
                          <Image
                            source={{ uri: firstImgUrl }}
                            style={styles.previewImage}
                          />
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
      <YearPickerModal
        visible={isYearModalVisible}
        onClose={() => setIsYearModalVisible(false)}
        availableYears={availableYears}
        initialYear={selectedYear}
        isDark={isDark}
        onConfirm={(year) => {
          setSelectedYear(year);
          setIsYearModalVisible(false);

          // 선택 완료 시 리스트 최상단으로 스크롤 이동
          setTimeout(() => {
            listRef.current?.scrollToOffset({
              offset: 0,
              animated: true,
            });
          }, 100);
        }}
      />

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
    backgroundColor: '#111111',
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
  title: { fontSize: 24 },

  darkSubText: { color: '#666' },
  content: {
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    resizeMode: 'cover',
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 60,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 10,
  },
  emptyTextDark: {
    color: '#aaa',
  },
  emptyButton: {
    backgroundColor: '#111111',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyButtonDark: {
    backgroundColor: '#ffffff',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyButtonTextDark: {
    color: '#111111',
  },
});
