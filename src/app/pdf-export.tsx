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
import { Asset } from 'expo-asset';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  BackIcon,
  SearchIcon,
  DocumentIcon,
  DownloadIcon,
} from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import { EMOTION_IMAGE_MAP } from '@/constants/emotions';
import Toast from 'react-native-toast-message';
import CustomSpinner from '@/components/common/CustomSpinner';

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
              /* 선택된 폰트 CSS 주입 */
              ${getFontStyles(diaryFontFamily || 'System')}
              
              /*@page { padding: 40px; }*/
              body { margin-left: 30px; margin-right: 30px; color: #333; line-height: 1.6; }
              
              /* 한 페이지에 1개의 일기씩 출력 */
              .diary-entry { page-break-after: always; margin-bottom: 20px; }
              .diary-entry:last-child { page-break-after: auto; }
              
              /* 날짜 및 감정 */
              .date { font-size: 20px; font-weight: bold; color: #444; margin-top: 40px; margin-bottom: 30px; }
              .emotion-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
              .emotion-img { width: 80px; height: 80px; object-fit: contain; }
              
              .diary-title { font-size: 22px; font-weight: bold; color: #333; margin-top: 0; margin-bottom: 15px; }
              .text-block { font-size: 16px; margin-top: 10px; white-space: pre-wrap; }
              
              /* 첨부 이미지 강제 30% (CSS 우선순위 확보) */
              .image-block { width: 30% !important; height: auto !important; border-radius: 8px; margin-top: 15px; display: block; object-fit: cover; }
              .error-block { padding: 20px; background: #eee; text-align: center; color: #888; border-radius: 8px; margin-top: 15px; font-size: 14px; }
              
              .rich-content { font-size: 16px; margin-top: 10px; line-height: 1.6; }
              /* 웹 에디터 이미지 강제 30% */
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

        // 날짜 출력
        // 날짜 포맷 변환 (2026-07-01 -> 2026.07.01.월요일)
        const dateObj = new Date(diary.date);
        const dayString = dayNames[dateObj.getDay()];
        const formattedDate = `${diary.date.replace(/-/g, '.')}.${dayString}`;

        // 변환된 날짜로 출력
        htmlContent += `<div class="date">${formattedDate}</div>`;

        const emotionList =
          diary.emotions && diary.emotions.length > 0
            ? diary.emotions
            : diary.emotion
              ? [diary.emotion]
              : [];

        // 감정 이미지 출력
        if (emotionList.length > 0) {
          htmlContent += `<div class="emotion-container">`;
          for (const emo of emotionList) {
            const emoSource = EMOTION_IMAGE_MAP[emo];
            if (emoSource) {
              try {
                // Asset을 통해 경로를 가져옴
                const asset = Asset.fromModule(emoSource);
                await asset.downloadAsync();
                const uriToRead = asset.localUri || asset.uri;

                // 💡 해결책: FileSystem 강제 복사 방식 대신 ImageManipulator 사용
                // 네이티브 단에서 이미지를 정상적으로 불러온 뒤 Base64로 인코딩합니다.
                const manipResult = await ImageManipulator.manipulateAsync(
                  uriToRead,
                  [], // 리사이즈 없이 원본 크기 유지
                  {
                    format: ImageManipulator.SaveFormat.PNG,
                    base64: true, // 순수 Base64 문자열 추출
                  },
                );

                if (manipResult.base64) {
                  const emoBase64Uri = `data:image/png;base64,${manipResult.base64}`;
                  htmlContent += `<img class="emotion-img" src="${emoBase64Uri}" />`;
                }
              } catch (e) {
                console.log('Emotion image load error:', e);
              }
            }
          }
          htmlContent += `</div>`;
        }

        // 일기 제목 및 내용
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
                  // 인라인 스타일로 한 번 더 width 30%를 강제 적용
                  htmlContent += `<img class="image-block" style="width: 30%; height: auto;" src="data:image/jpeg;base64,${manipResult.base64}" />`;
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
                  htmlContent += `<img class="image-block" style="width: 30%; height: auto;" src="data:image/${ext};base64,${base64Image}" />`;
                } catch (fsError) {
                  console.log('이미지 로드 완전 실패:', fsError);
                  htmlContent += `<div class="error-block">[이미지를 불러올 수 없습니다: 원본 파일이 삭제되었거나 경로가 잘못되었습니다]</div>`;
                }
              }
            }
          }
        }

        htmlContent += `</div>`; // diary-entry 닫기
      }

      htmlContent += `</body></html>`;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // 원하는 파일명 설정 (예: 2026-07_나의일기.pdf)
      const fileName = `${monthStr}_동글일기.pdf`;
      const newUri = `${FileSystem.cacheDirectory}${fileName}`;

      // 기존 복잡한 이름의 파일을 우리가 정한 이름으로 이동(변경)
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      // 안드로이드 공유 창 호출 시 잠금화면 방어 플래그 ON
      setIsSystemAction(true);

      // 변경된 이름의 파일로 공유/저장 실행
      await Sharing.shareAsync(newUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${monthStr} 일기 저장`, // 안드로이드 공유 창 타이틀
      });

      // Toast.show({
      //   type: 'success',
      //   text1: 'PDF가 생성되었어요',
      //   position: 'top',
      //   topOffset: 60,
      // });
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
    // 현재 화면에서 2단계를 뒤로가기(Pop)하여 메인으로 돌아갑니다.
    router.dismiss(2);

    // 뒤로가기 애니메이션이 끝날 즈음 모달 띄우기
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

      {/* 전체 화면 반투명 로딩 오버레이 */}
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

  // Header Styles
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

  // Empty State Styles
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

  // Full Screen Loading Overlay
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // 가장 위에 위치하도록 설정
  },
});
