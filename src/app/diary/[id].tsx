import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import AppText from '@/components/atoms/AppText';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useLocalSearchParams,
  router,
  useNavigation,
  Stack,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useDiaryStore } from '../../store/useDiaryStore';
import {
  BackIcon,
  OptionIcon,
  DetailEditIcon,
  DetailShareIcon,
  DetailDeleteIcon,
} from '../../../assets/icons';
import RenderHtml, {
  defaultSystemFonts,
  HTMLContentModel,
  HTMLElementModel,
} from 'react-native-render-html';
import {
  EMOTION_IMAGE_MAP,
  ANIMATED_EMOTION_IMAGE_MAP,
} from '@/constants/emotions';
import { FONT_SIZES } from '@/constants/font';
import Toast from 'react-native-toast-message';

const customHTMLElementModels = {
  aligncenter: HTMLElementModel.fromCustomModel({
    tagName: 'aligncenter',
    contentModel: HTMLContentModel.phrasing, // 뷰가 아닌 '순수 텍스트' 모델로 강제 지정
  }),
  alignright: HTMLElementModel.fromCustomModel({
    tagName: 'alignright',
    contentModel: HTMLContentModel.phrasing,
  }),
};

const customRenderers = {
  img: ({ tnode }: any) => {
    const { src } = tnode.attributes;
    return (
      <Image
        source={{ uri: src }}
        style={{
          width: '100%',
          height: 250,
          borderRadius: 12,
          marginVertical: 15,
        }}
        contentFit="cover"
      />
    );
  },
};

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { width } = useWindowDimensions(); // 컴포넌트 내부로 이동 (안전성 확보)

  const {
    diaries,
    deleteDiary,
    theme,
    diaryFontSize,
    diaryFontFamily,
    selectedDate,
  } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const diary = diaries.find((d) => d.id === id);
  const viewShotRef = useRef<ViewShot>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const dateObj = new Date(selectedDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = week[dateObj.getDay()];

  useEffect(() => {
    if (diary) {
      navigation.setOptions({
        headerTitle: diary.date,
        headerRight: () => (
          <AppTouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        ),
      });
    }
  }, [navigation, diary, isDark]);

  const currentFontSize = FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES];
  const activeFontFamily =
    diaryFontFamily === 'System' ? undefined : diaryFontFamily;

  // useEffect(() => {
  //   if (diary?.content) {
  //     console.log('--- 렌더링될 HTML 콘텐츠 ---');
  //     console.log(processHtmlContent(diary.content));
  //     console.log('---------------------------');
  //   }
  // }, [diary?.content]);

  const systemFonts = activeFontFamily
    ? [activeFontFamily, ...defaultSystemFonts]
    : defaultSystemFonts;

  const renderers = {
    img: ({ tnode }: any) => {
      const { src } = tnode.attributes;
      return (
        <Image
          source={{ uri: src }}
          style={{
            width: '100%',
            height: 250,
            borderRadius: 12,
            marginVertical: 15,
          }}
          contentFit="cover"
        />
      );
    },
  };

  const processHtmlContent = (html: string) => {
    if (!html) return '';

    // 1. 구식 align 속성 스타일로 변환
    let processed = html.replace(
      /align=(['"])(left|center|right|justify)\1/gi,
      'style="text-align: $2;"',
    );

    processed = processed.replace(
      /style=["']text-align:\s*center;?["']/gi,
      'class="app-align-center"',
    );
    processed = processed.replace(
      /style=["']text-align:\s*right;?["']/gi,
      'class="app-align-right"',
    );
    processed = processed.replace(
      /style=["']text-align:\s*left;?["']/gi,
      'class="app-align-left"',
    );
    return processed;
  };

  const memoizedHtml = useMemo(() => {
    // if (diary.content === undefined) return null;
    if (!diary || diary.content === undefined) return null;

    return (
      <View style={[styles.renderHtmlWrapper]}>
        <RenderHtml
          contentWidth={width - 40}
          source={{ html: processHtmlContent(diary.content) }}
          systemFonts={systemFonts}
          renderers={customRenderers}
          classesStyles={{
            'app-align-center': { textAlign: 'center' },
            'app-align-right': { textAlign: 'right' },
            'app-align-left': { textAlign: 'left' },
          }}
          enableExperimentalMarginCollapsing={true}
          defaultTextProps={{
            maxFontSizeMultiplier: 1.5,
          }}
          baseStyle={{
            fontSize: currentFontSize,
            fontFamily: activeFontFamily,
            color: isDark ? '#ffffff' : '#111111',
            lineHeight: currentFontSize * 1.5,
            width: '100%',
          }}
          tagsStyles={{
            img: {
              borderRadius: 8,
              marginVertical: 15,
            },
            p: { marginVertical: 4 },
            div: { marginVertical: 4 },
            body: { width: '100%' },
          }}
          computeEmbeddedFlexStyles={(style) => style}
        />
      </View>
    );
  }, [
    diary?.content,
    width,
    currentFontSize,
    activeFontFamily,
    isDark,
    systemFonts,
  ]);

  if (!diary)
    return (
      <View style={[styles.fallback, isDark && styles.darkFallback]}>
        <AppText useDiaryFont style={isDark && styles.darkText}>
          일기를 찾을 수 없어요
        </AppText>
      </View>
    );

  const handleDeleteClick = () => {
    setMenuVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    deleteDiary(diary.id);
    setDeleteModalVisible(false);
    router.back();

    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: '일기를 지웠어요',
        position: 'top',
        topOffset: 60,
      });
    }, 1000);
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) await Sharing.shareAsync(uri);
    } catch (error) {
      Toast.show({
        type: 'warn',
        text1: '이미지 공유에 실패했거나 지원하지 않는 기기에요',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>

        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => setMenuVisible(true)}>
            <OptionIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#111111' : '#FCFBFA' }}
      >
        <ViewShot
          ref={viewShotRef}
          // 기존 ScrollView의 contentContainerStyle을 ViewShot의 style로 이동
          style={[
            styles.scrollContainer,
            { backgroundColor: isDark ? '#111111' : '#FCFBFA' },
          ]}
          options={{ format: 'jpg', quality: 0.9 }}
        >
          <View style={styles.infoArea}>
            <View style={styles.emotionsContainer}>
              {diary.emotions && diary.emotions.length > 0 ? (
                diary.emotions.map((emotionId, index) =>
                  ANIMATED_EMOTION_IMAGE_MAP[emotionId] ||
                  EMOTION_IMAGE_MAP[emotionId] ? (
                    <Image
                      key={`${diary.id}-${emotionId}-${index}`}
                      source={
                        ANIMATED_EMOTION_IMAGE_MAP[emotionId] ||
                        EMOTION_IMAGE_MAP[emotionId]
                      }
                      style={styles.emotionImage}
                      contentFit="contain"
                    />
                  ) : (
                    <AppText key={index} style={styles.fallbackEmotionText}>
                      {emotionId}
                    </AppText>
                  ),
                )
              ) : diary.emotion && EMOTION_IMAGE_MAP[diary.emotion] ? (
                <Image
                  source={
                    ANIMATED_EMOTION_IMAGE_MAP[diary.emotion] ||
                    EMOTION_IMAGE_MAP[diary.emotion]
                  }
                  style={styles.emotionImage}
                  contentFit="contain"
                />
              ) : (
                <AppText style={styles.fallbackEmotionText}>
                  {diary.emotion}
                </AppText>
              )}
            </View>

            <View style={styles.dateBox}>
              <AppText useDiaryFont style={styles.date}>
                {`${year}년 ${month}월 ${day}일`}
              </AppText>
              <AppText useDiaryFont style={styles.day}>
                {dayOfWeek}요일
              </AppText>
            </View>
          </View>

          {diary.title && (
            <AppText
              useDiaryFont
              style={[
                styles.title,
                isDark && styles.darkText,
                { fontFamily: activeFontFamily },
              ]}
            >
              {diary.title}
            </AppText>
          )}

          {diary.content !== undefined
            ? memoizedHtml
            : diary.blocks?.map((block) =>
                block.type === 'image' ? (
                  <Image
                    key={block.id}
                    source={{ uri: block.value }}
                    style={styles.attachedImage}
                    contentFit="cover"
                  />
                ) : (
                  <AppText
                    key={block.id}
                    style={[
                      styles.textBlock,
                      isDark && styles.darkText,
                      {
                        fontSize: currentFontSize,
                        lineHeight: currentFontSize * 1.5,
                        fontFamily: activeFontFamily,
                      },
                    ]}
                  >
                    {block.value}
                  </AppText>
                ),
              )}
        </ViewShot>
      </ScrollView>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuBox, isDark && styles.darkMenuBox]}>
            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                router.push(`/write?editId=${diary.id}`);
              }}
            >
              <DetailEditIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                수정하기
              </AppText>
            </AppTouchableOpacity>
            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={handleShare}
            >
              <DetailShareIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                이미지로 공유
              </AppText>
            </AppTouchableOpacity>
            <AppTouchableOpacity
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={handleDeleteClick}
            >
              <DetailDeleteIcon width={24} height={24} color={'#FF6262'} />
              <AppText style={[styles.menuText, { color: '#FF6262' }]}>
                삭제하기
              </AppText>
            </AppTouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <AppConfirmModal
        visible={deleteModalVisible}
        title="일기 삭제"
        message={'정말로 일기를 삭제할까요?\n삭제된 일기는 복구할 수 없어요.'}
        confirmText="삭제"
        confirmColor="#FF6262" // 삭제니까 빨간색으로 지정
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        reverseButtons={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  darkFallback: { backgroundColor: '#111111' },

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

  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    // alignItems: 'center',
    gap: 30,
  },

  infoArea: {
    alignItems: 'center',
    gap: 10,
  },
  emotionsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  emotionImage: {
    width: 50,
    height: 50,
  },
  fallbackEmotionText: {
    fontSize: 16,
  },
  dateBox: { alignItems: 'center', gap: 4 },
  date: { fontSize: 14, lineHeight: 16 },
  day: { fontSize: 14, color: '#666', lineHeight: 16 },

  title: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 32,
  },

  renderHtmlWrapper: {
    width: '100%',
    textAlign: 'center',
  },

  attachedImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    // resizeMode: 'cover',
  },

  textBlock: {
    width: '100%',
  },

  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },

  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuBox: {
    backgroundColor: '#ffffff',
    width: 160,
    borderRadius: 20,
    // overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    borderBottomColor: '#f1f2f3',
    flexDirection: 'row',
    gap: 4,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  darkMenuItem: { borderBottomColor: '#333' },
  menuText: { fontSize: 14 },
});
