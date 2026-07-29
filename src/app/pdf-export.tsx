import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  BackIcon,
  SearchIcon,
  DocumentIcon,
  DownloadIcon,
} from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import Toast from 'react-native-toast-message';
import CustomSpinner from '@/components/common/CustomSpinner';
import { EMOTION_BASE64_MAP } from '@/constants/emotionBase64';

export default function PdfExportScreen() {
  const { diaries, theme, diaryFontFamily, setIsSystemAction } =
    useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [isExporting, setIsExporting] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set(diaries.map((d) => d.date.substring(0, 7)));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [diaries]);

  const getFontStyles = (fontId: string) => {
    switch (fontId) {
      case 'NanumSquareRound':
        return `
          @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.woff');
          body { font-family: 'NanumSquareRound', sans-serif; }
        `;
      case 'KyoboHandwriting':
        return `
          @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/KyoboHandwriting2019.woff');
          body { font-family: 'KyoboHandwriting2019', sans-serif; }
        `;
      case 'GowunBatang':
        return `
          @import url('https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap');
          body { font-family: 'Gowun Batang', serif; }
        `;
      case 'IsYun':
        return `
          @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202-2@1.0/LeeSeoyun.woff');
          body { font-family: 'LeeSeoyun', sans-serif; }
        `;
      default:
        return `body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }`;
    }
  };

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
              ${getFontStyles(diaryFontFamily || 'System')}
              
              body { margin-left: 30px; margin-right: 30px; color: #333; line-height: 1.6; }
              
              .diary-entry { page-break-after: always; margin-bottom: 20px; }
              .diary-entry:last-child { page-break-after: auto; }
              
              .date { font-size: 20px; font-weight: bold; color: #444; margin-top: 40px; margin-bottom: 30px; }
              .emotion-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
              .emotion-img { width: 80px; height: 80px; object-fit: contain; }
              
              .diary-title { font-size: 22px; font-weight: bold; color: #333; margin-top: 0; margin-bottom: 15px; }
              .text-block { font-size: 16px; margin-top: 10px; white-space: pre-wrap; }
              
              .image-block { width: 30% !important; height: auto !important; border-radius: 8px; margin-top: 15px; display: block; object-fit: cover; }
              .error-block { padding: 20px; background: #eee; text-align: center; color: #888; border-radius: 8px; margin-top: 15px; font-size: 14px; }
              
              .rich-content { font-size: 16px; margin-top: 10px; line-height: 1.6; }
              .rich-content img { width: 30% !important; height: auto !important; display: block; margin: 15px 0; border-radius: 8px; }
            </style>
          </head>
          <body>
      `;

      const dayNames = [
        '일요일',
        '월요일',
        '화요일',
        '수요일',
        '목요일',
        '금요일',
        '토요일',
      ];

      for (const diary of monthDiaries) {
        htmlContent += `<div class="diary-entry">`;

        const dateObj = new Date(diary.date);
        const dayString = dayNames[dateObj.getDay()];
        const formattedDate = `${diary.date.replace(/-/g, '.')}.${dayString}`;

        htmlContent += `<div class="date">${formattedDate}</div>`;

        const emotionList =
          diary.emotions && diary.emotions.length > 0
            ? diary.emotions
            : diary.emotion
              ? [diary.emotion]
              : [];

        if (emotionList.length > 0) {
          htmlContent += `<div class="emotion-container">`;

          for (const emo of emotionList) {
            const base64String = EMOTION_BASE64_MAP[emo];
            if (base64String) {
              htmlContent += `<img class="emotion-img" src="${base64String}" />`;
            }
          }
          htmlContent += `</div>`;
        }

        if (diary.title) {
          htmlContent += `<h2 class="diary-title">${diary.title}</h2>`;
        }

        // 💡 신버전(HTML 구조) 데이터 PDF 변환 처리
        if (diary.content !== undefined) {
          let processedContent = diary.content;
          const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
          const matches = [...processedContent.matchAll(regex)];

          for (const match of matches) {
            const fileUri = match[1];
            try {
              // PDF 출력에 적합하도록 이미지를 최적화(리사이징/압축) 후 Base64로 치환
              const manipResult = await ImageManipulator.manipulateAsync(
                fileUri,
                [{ resize: { width: 600 } }],
                {
                  compress: 0.7,
                  format: ImageManipulator.SaveFormat.JPEG,
                  base64: true,
                },
              );

              if (manipResult.base64) {
                const base64Src = `data:image/jpeg;base64,${manipResult.base64}`;
                processedContent = processedContent.replace(fileUri, base64Src);
              }
            } catch (err) {
              console.log('PDF 이미지 로드 실패 (파일 유실 등):', err);
            }
          }
          htmlContent += `<div class="rich-content">${processedContent}</div>`;
        }
        // 💡 구버전(blocks 구조) 데이터 하위 호환 처리
        else if (diary.blocks) {
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
                  htmlContent += `<img class="image-block" style="width: 30%; height: auto;" src="data:image/jpeg;base64,${manipResult.base64}" />`;
                }
              } catch (compressError) {
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
                  htmlContent += `<img class="image-block" style="width: 30%; height: auto;" src="data:image/${ext};base64,${base64Image}" />`;
                } catch (fsError) {
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

      const fileName = `${monthStr}_동글일기.pdf`;
      const newUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      setIsSystemAction(true);

      await Sharing.shareAsync(newUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${monthStr} 일기 저장`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'PDF 생성 중 문제가 발생했어요',
        position: 'top',
        topOffset: 60,
      });
      console.error(error);
    } finally {
      setIsExporting(false);
      setLoadingMonth(null);
    }
  };

  const handleGoToWrite = () => {
    router.dismiss(2);
    setTimeout(() => {
      router.push('/emotion-select');
    }, 300);
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.darkContainer]}
      edges={['top', 'left', 'right']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity
            onPress={() => router.back()}
            disabled={isExporting}
          >
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
        <View style={styles.headerTitleWrapper}>
          <AppText
            style={[styles.customHeaderTitle, isDark && styles.darkText]}
          >
            PDF 저장
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <AppText style={[styles.guideText, isDark && styles.darkSubText]}>
        한 달 단위로 작성한 일기를 PDF로 저장할 수 있어요.{'\n'}데이터가 클 경우
        시간이 걸릴 수 있습니다.
      </AppText>

      <View style={styles.dividerWrapper}>
        <SvgDashedLine />
      </View>

      <FlatList
        data={availableMonths}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SearchIcon
              width={60}
              height={60}
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
                <DocumentIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />

                <AppText style={[styles.monthText, isDark && styles.darkText]}>
                  {year}년 {month}월 일기
                </AppText>
              </View>

              {isThisLoading ? (
                <ActivityIndicator color={isDark ? '#ffffff' : '#111111'} />
              ) : (
                <DownloadIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}
            </AppTouchableOpacity>
          );
        }}
      />

      {isExporting && (
        <View style={styles.fullScreenOverlay}>
          <CustomSpinner />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: {
    backgroundColor: '#111111',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerTitleWrapper: { flex: 2, alignItems: 'center' },
  customHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  rightIconsWrapper: { flex: 1 },

  guideText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  darkSubText: { color: '#aaa' },

  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 15 },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 10,
  },
  emptyTextDark: { color: '#aaa' },
  emptyButton: {
    backgroundColor: '#111111',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyButtonDark: { backgroundColor: '#ffffff' },
  emptyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  emptyButtonTextDark: { color: '#111111' },

  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f2f3',
    paddingHorizontal: 16,
    height: 60,
    borderRadius: 6,
    marginBottom: 15,
  },
  darkCard: { backgroundColor: '#1e1e1e' },

  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthText: { fontSize: 14, color: '#111111' },
  darkText: { color: '#ffffff' },

  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
