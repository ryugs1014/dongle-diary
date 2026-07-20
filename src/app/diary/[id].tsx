import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import AppText from '@/components/AppText';
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
import { BackIcon, OptionIcon } from '../../../assets/icons';
import RenderHtml, {
  defaultSystemFonts,
  HTMLContentModel, // 💡 추가
  HTMLElementModel, // 💡 추가
} from 'react-native-render-html';

const FONT_SIZES = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
};

const customHTMLElementModels = {
  aligncenter: HTMLElementModel.fromCustomModel({
    tagName: 'aligncenter',
    contentModel: HTMLContentModel.phrasing, // 💡 중요: 뷰가 아닌 '순수 텍스트' 모델로 강제 지정
  }),
  alignright: HTMLElementModel.fromCustomModel({
    tagName: 'alignright',
    contentModel: HTMLContentModel.phrasing,
  }),
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
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, diary, isDark]);

  if (!diary)
    return (
      <View style={[styles.fallback, isDark && styles.darkFallback]}>
        <AppText style={isDark && styles.darkText}>
          일기를 찾을 수 없습니다.
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
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) await Sharing.shareAsync(uri);
    } catch (error) {
      alert('이미지 공유에 실패했거나 지원하지 않는 기기입니다.');
    }
  };

  const currentFontSize = FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES];
  const activeFontFamily =
    diaryFontFamily === 'System' ? undefined : diaryFontFamily;

  useEffect(() => {
    if (diary?.content) {
      console.log('--- 렌더링될 HTML 콘텐츠 ---');
      console.log(processHtmlContent(diary.content));
      console.log('---------------------------');
    }
  }, [diary?.content]);

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
          resizeMode="cover"
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

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.rightIconsWrapper}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <OptionIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ViewShot
        ref={viewShotRef}
        style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#fff' }}
        options={{ format: 'jpg', quality: 0.9 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.infoArea}>
            <AppText style={styles.emotion}>
              {diary.emotions && diary.emotions.length > 0
                ? diary.emotions.join(' ')
                : diary.emotion}
            </AppText>

            <View style={styles.dateBox}>
              <AppText style={styles.date}>
                {`${year}년 ${month}월 ${day}일`}
              </AppText>
              <AppText style={styles.day}>{dayOfWeek}요일</AppText>
            </View>
          </View>

          {diary.title && (
            <AppText
              style={[
                styles.title,
                isDark && styles.darkText,
                { fontFamily: activeFontFamily },
              ]}
            >
              {diary.title}
            </AppText>
          )}

          {/* 변경된 부분: View로 감싸서 width 100% 강제 적용 */}
          {diary.content !== undefined ? (
            <View style={[styles.renderHtmlWrapper]}>
              <RenderHtml
                contentWidth={width - 40}
                source={{ html: processHtmlContent(diary.content) }}
                // source={{ html: diary.content }}
                systemFonts={systemFonts}
                renderers={renderers}

                classesStyles={{
                  'app-align-center': {
                    textAlign: 'center',
                  },
                  'app-align-right': {
                    textAlign: 'right',
                  },
                  'app-align-left': {
                    textAlign: 'left',
                  },
                }}

                enableExperimentalMarginCollapsing={true}
                defaultTextProps={{
                  maxFontSizeMultiplier: 1.5,
                }}
                baseStyle={{
                  fontSize: currentFontSize,
                  fontFamily: activeFontFamily,
                  color: isDark ? '#ffffff' : '#000000',
                  lineHeight: currentFontSize * 1.5,
                  width: '100%',
                }}
                tagsStyles={{
                  img: {
                    // width: '100%', // 가로 넓이 꽉 채우기
                    // height: 250, // 말씀하신 대로 높이 250 고정
                    // objectFit: 'cover', // 높이를 고정해도 사진이 찌그러지지 않게 덮기
                    borderRadius: 8,
                    marginVertical: 15,
                  },
                  p: {
                    marginVertical: 4,
                  },
                  div: {
                    marginVertical: 4,
                  },
                  body: {
                    width: '100%',
                  },
                }}
                computeEmbeddedFlexStyles={(style) => style}
              />
            </View>
          ) : (
            // 기존 fallback 코드 동일하게 유지
            diary.blocks?.map((block) =>
              block.type === 'image' ? (
                <Image
                  key={block.id}
                  source={{ uri: block.value }}
                  style={styles.attachedImage}
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
            )
          )}
        </ScrollView>
      </ViewShot>

      {/* 우측 상단 옵션 메뉴 모달 */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuBox, isDark && styles.darkMenuBox]}>
            <TouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                router.push(`/write?editId=${diary.id}`);
              }}
            >
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                수정하기
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={handleShare}
            >
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                이미지로 공유
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteClick}
            >
              <AppText style={[styles.menuText, { color: '#FF6F61' }]}>
                삭제하기
              </AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 삭제 확인 커스텀 모달 */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, isDark && styles.darkMenuBox]}>
            <AppText style={[styles.alertTitle, isDark && styles.darkText]}>
              일기 삭제
            </AppText>
            <AppText
              style={[styles.alertMessage, isDark && styles.darkSubText]}
            >
              정말로 이 일기를 삭제하시겠습니까?{'\n'}삭제된 일기는 복구할 수
              없습니다.
            </AppText>
            <View style={[styles.alertButtons, isDark && styles.darkMenuItem]}>
              <TouchableOpacity
                style={styles.alertBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <AppText style={styles.alertBtnText}>취소</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alertBtn,
                  { borderLeftWidth: 1, borderColor: isDark ? '#333' : '#eee' },
                ]}
                onPress={confirmDelete}
              >
                <AppText style={[styles.alertBtnText, { color: '#FF6F61' }]}>
                  삭제
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  darkContainer: { backgroundColor: '#111111' },

  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  darkFallback: { backgroundColor: '#121212' },

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
  emotion: { fontSize: 50 },
  dateBox: { alignItems: 'center', gap: 4 },
  date: { fontSize: 14 },
  day: { fontSize: 14, color: '#666' },

  title: { fontSize: 24, textAlign: 'center' },

  renderHtmlWrapper: {
    width: '100%',
    textAlign: 'center',
  },

  attachedImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  textBlock: {
    width: '100%',
  },

  darkText: { color: '#fff' },
  darkSubText: { color: '#aaa' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  menuBox: {
    backgroundColor: 'white',
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  darkMenuItem: { borderBottomColor: '#333' },
  menuText: { fontSize: 16 },

  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  alertBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  alertBtnText: { fontSize: 16, color: '#007AFF' },
});
