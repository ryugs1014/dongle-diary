import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useDiaryStore } from '@/store/useDiaryStore';
import { EMOTION_IMAGE_MAP } from '@/constants/emotions';

interface DiaryCardProps {
  item: any; // 필요에 따라 Diary 타입으로 지정해주세요.
}

export default function DiaryCard({ item }: DiaryCardProps) {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

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
            item.emotions.map((emotionId: string, index: number) =>
              EMOTION_IMAGE_MAP[emotionId] ? (
                <Image
                  key={`${item.id}-${emotionId}-${index}`}
                  source={EMOTION_IMAGE_MAP[emotionId]}
                  style={styles.emotionImage}
                  contentFit="contain"
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
              contentFit="contain"
            />
          ) : (
            <AppText style={styles.fallbackEmotionText}>{item.emotion}</AppText>
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
        <AppText useDiaryFont style={[styles.title, isDark && styles.darkText]}>
          {item.title}
        </AppText>
      )}

      {item.content !== undefined ? (
        <View>
          {(() => {
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
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
                    style={[styles.content, isDark && styles.darkSubText]}
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
        item.blocks?.map((block: any) =>
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
}

const styles = StyleSheet.create({
  card: { paddingVertical: 30, gap: 10 },
  darkCard: { borderColor: 'rgba(255, 255, 255, 0.2)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emotionsContainer: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  emotionImage: { width: 40, height: 40 },
  fallbackEmotionText: { fontSize: 16 },
  dateBox: { gap: 4 },
  date: { fontSize: 14, lineHeight: 16 },
  day: { fontSize: 14, color: '#666', lineHeight: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  darkText: { color: '#ffffff' },
  content: { fontSize: 14, lineHeight: 24 },
  darkSubText: { color: '#aaa' },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
  },
});
