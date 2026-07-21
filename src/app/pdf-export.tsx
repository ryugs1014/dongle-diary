import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDiaryStore } from '../store/useDiaryStore';

export default function PdfExportScreen() {
  const { diaries, theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [isExporting, setIsExporting] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set(diaries.map((d) => d.date.substring(0, 7)));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [diaries]);

  const exportMonthToPDF = async (monthStr: string) => {
    if (isExporting) return;
    setIsExporting(true);
    setLoadingMonth(monthStr);

    try {
      const monthDiaries = diaries
        .filter((d) => d.date.startsWith(monthStr))
        .sort((a, b) => a.date.localeCompare(b.date));

      let htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .cover { text-align: center; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 2px solid #FF6F61; }
              .cover h1 { color: #FF6F61; font-size: 36px; margin: 0; }
              .cover p { font-size: 18px; color: #888; }
              .diary-entry { page-break-inside: avoid; margin-bottom: 40px; background: #fafafa; padding: 20px; border-radius: 12px; }
              .header { display: flex; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; }
              .date { font-size: 20px; font-weight: bold; color: #444; }
              .emotion { font-size: 28px; margin-left: 10px; }
              .diary-title { font-size: 22px; font-weight: bold; color: #333; margin-top: 0; margin-bottom: 15px; }
              .text-block { font-size: 16px; margin-top: 10px; white-space: pre-wrap; }
              .image-block { width: 100%; max-width: 500px; border-radius: 8px; margin-top: 15px; display: block; margin-left: auto; margin-right: auto; object-fit: cover; }
              .error-block { padding: 20px; background: #eee; text-align: center; color: #888; border-radius: 8px; margin-top: 15px; font-size: 14px; }
              
              /* 웹 에디터(HTML content) 스타일 추가 */
              .rich-content { font-size: 16px; margin-top: 10px; line-height: 1.6; }
              .rich-content img { max-width: 100%; height: auto; display: block; margin: 15px auto; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="cover">
              <h1>나의 일기장</h1>
              <p>${monthStr.split('-')[0]}년 ${monthStr.split('-')[1]}월의 기록</p>
            </div>
      `;

      for (const diary of monthDiaries) {
        const displayEmotion =
          diary.emotions && diary.emotions.length > 0
            ? diary.emotions.join(' ')
            : diary.emotion || '';

        htmlContent += `<div class="diary-entry">`;
        htmlContent += `<div class="header"><span class="date">${diary.date}</span><span class="emotion">${displayEmotion}</span></div>`;

        if (diary.title) {
          htmlContent += `<h2 class="diary-title">${diary.title}</h2>`;
        }

        if (diary.content !== undefined) {
          htmlContent += `<div class="rich-content">${diary.content}</div>`;
        } else if (diary.blocks) {
          for (const block of diary.blocks) {
            if (block.type === 'text') {
              htmlContent += `<div class="text-block">${block.value}</div>`;
            } else if (block.type === 'image') {
              let imageUri = block.value;
              if (
                !imageUri.startsWith('file://') &&
                !imageUri.startsWith('http')
              ) {
                imageUri = 'file://' + imageUri;
              }

              try {
                const manipResult = await ImageManipulator.manipulateAsync(
                  imageUri,
                  [{ resize: { width: 600 } }],
                  {
                    compress: 0.7,
                    format: ImageManipulator.SaveFormat.JPEG,
                    base64: true,
                  },
                );

                if (manipResult.base64) {
                  htmlContent += `<img class="image-block" src="data:image/jpeg;base64,${manipResult.base64}" />`;
                }
              } catch (compressError) {
                console.log('이미지 압축 실패, 원본 변환 시도:', compressError);

                try {
                  const base64Image = await FileSystem.readAsStringAsync(
                    imageUri,
                    {
                      encoding: FileSystem.EncodingType.Base64,
                    },
                  );
                  const ext = imageUri.toLowerCase().endsWith('png')
                    ? 'png'
                    : 'jpeg';
                  htmlContent += `<img class="image-block" src="data:image/${ext};base64,${base64Image}" />`;
                } catch (fsError) {
                  console.log('이미지 로드 완전 실패:', fsError);
                  htmlContent += `<div class="error-block">[이미지를 불러올 수 없습니다: 원본 파일이 삭제되었거나 경로가 잘못되었습니다]</div>`;
                }
              }
            }
          }
        }

        htmlContent += `</div>`;
      }

      htmlContent += `</body></html>`;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
    } catch (error) {
      Alert.alert('오류', 'PDF를 생성하는 중에 문제가 발생했습니다.');
      console.error(error);
    } finally {
      setIsExporting(false);
      setLoadingMonth(null);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.darkContainer]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{ headerTitle: 'PDF로 내보내기', headerBackTitle: '설정' }}
      />

      <AppText style={[styles.guideText, isDark && styles.darkSubText]}>
        다운로드할 월을 선택해주세요.{'\n'}사진이 많을 경우 시간이 조금 걸릴 수
        있습니다.
      </AppText>

      <FlatList
        data={availableMonths}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <AppText style={styles.emptyText}>작성된 일기가 없습니다.</AppText>
        }
        renderItem={({ item }) => {
          const [year, month] = item.split('-');
          const isThisLoading = loadingMonth === item;

          return (
            <AppTouchableOpacity
              style={[
                styles.monthCard,
                isDark && styles.darkCard,
                isExporting && !isThisLoading && { opacity: 0.5 },
              ]}
              onPress={() => exportMonthToPDF(item)}
              disabled={isExporting}
            >
              <View style={styles.monthLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={isDark ? '#ccc' : '#555'}
                />
                <AppText style={[styles.monthText, isDark && styles.darkText]}>
                  {year}년 {month}월 일기
                </AppText>
              </View>

              {isThisLoading ? (
                <ActivityIndicator color="#FF6F61" />
              ) : (
                <Ionicons name="download-outline" size={24} color="#FF6F61" />
              )}
            </AppTouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#121212' },
  guideText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  darkSubText: { color: '#aaa' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  darkCard: { backgroundColor: '#1e1e1e' },
  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  monthText: { fontSize: 18, fontWeight: '500', color: '#333' },
  darkText: { color: '#fff' },
});
