import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  useColorScheme,
  Animated,
  BackHandler,
} from 'react-native';
import { Image } from 'expo-image';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import AppText from '@/components/atoms/AppText';
import AppTextInput from '@/components/atoms/AppTextInput';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  CloseIcon,
  BackIcon,
  ImageIcon,
  ClockIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  WriteIcon,
  AddBigIcon,
  AddIcon,
  AddDarkIcon,
  MinusIcon,
  MinusDarkIcon,
} from '../../assets/icons';
import { actions, RichEditor } from 'react-native-pell-rich-editor';
import {
  EMOTION_IMAGE_MAP,
  ANIMATED_EMOTION_IMAGE_MAP,
} from '@/constants/emotions';
import { FONT_SIZES } from '@/constants/font';
import EmotionSelectModal from '@/components/modals/EmotionSelectModal';
import Toast from 'react-native-toast-message';

// 💡 메모장에서 사용하던 파일 시스템 및 암호화 라이브러리 임포트
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { IMAGE_DIR } from '@/utils/image';

// 지워지지 않는 기본 블록 상수화 (좌측 정렬 + 빈 줄)
const BASE_BLOCK = '<div style="text-align: left;"><br></div>';

// 💡 메모장의 이미지 분리 저장 로직 추가
const processHtmlForSave = async (html: string) => {
  let processedHtml = html;

  const regex = /src=["']?(data:image\/([^;]+);base64,([^"'>\s]+))["']?/gi;
  const matches = [...html.matchAll(regex)];

  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
  } catch (dirError) {
    console.log('디렉토리 생성 실패:', dirError);
  }

  for (const match of matches) {
    const fullSrc = match[1];
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const base64Data = match[3];

    // 해시값을 이용하여 동일 이미지 중복 저장 방지
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64Data.substring(0, 500) + base64Data.length,
    );
    const fileName = `${hash}.${ext}`;
    const fileUri = IMAGE_DIR + fileName;

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`✅ [저장 3단계] 새 로컬 파일 생성됨: ${fileName}`);
    } else {
      console.log(
        `🔄 [저장 3단계] 이미 동일한 로컬 파일이 존재함: ${fileName}`,
      );
    }

    // HTML 내부의 엄청나게 긴 base64 소스를 짧은 file:// 경로로 치환
    processedHtml = processedHtml.replace(fullSrc, fileUri);
  }

  return processedHtml;
};

// 💡 메모장의 이미지 불러오기(로컬파일 -> Base64 변환) 로직 추가
const processHtmlForLoad = async (html: string) => {
  if (!html) return '<h1></h1>';
  let processedHtml = html;

  const regex = /src=["']?([^"'\s>]+)["']?/gi;
  const matches = [...html.matchAll(regex)];

  for (const match of matches) {
    const fullSrc = match[1];

    if (fullSrc.startsWith('data:')) {
      continue;
    }

    let fileUri = fullSrc;
    if (!fileUri.startsWith('file://') && !fileUri.startsWith('http')) {
      fileUri = 'file://' + fileUri.replace(/^[/\\]+/, '/');
    }

    const targetFileName = fullSrc.split('/').pop()?.split('?')[0] || '';

    try {
      let fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists && targetFileName) {
        const safeDir = IMAGE_DIR.endsWith('/') ? IMAGE_DIR : `${IMAGE_DIR}/`;
        fileUri = safeDir + targetFileName;
        fileInfo = await FileSystem.getInfoAsync(fileUri);
      }

      if (fileInfo.exists) {
        if (fileInfo.size === 0) {
          continue;
        }

        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const ext = targetFileName.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;

        const cleanBase64 = base64Data.replace(/(\r\n|\n|\r|\s)/gm, '');
        const base64Src = `data:image/${mimeType};base64,${cleanBase64}`;

        processedHtml = processedHtml.replace(fullSrc, base64Src);
      } else {
        console.log(`🚨 [로드 실패] 기기에서 끝내 이미지를 찾을 수 없음`);
      }
    } catch (e) {
      console.log(`❌ [로드 중 에러 발생]:`, e);
    }
  }

  return processedHtml;
};

export default function WriteScreen() {
  const insets = useSafeAreaInsets();
  const { editId, autoLoadDraft } = useLocalSearchParams();
  const {
    theme,
    diaryFontSize,
    diaryFontFamily,
    selectedDate,
    selectedEmotions,
    setSelectedEmotions,
    addDiary,
    updateDiary,
    diaries,
    draft,
    saveDraft,
    clearDraft,
  } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [title, setTitle] = useState('');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(
    'left',
  );
  const [emotionModalVisible, setEmotionModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [draftModalVisible, setDraftModalVisible] = useState(false);
  const [isTitleActive, setIsTitleActive] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [editorHeight, setEditorHeight] = useState(300);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(!editId);

  const titleInputRef = useRef<TextInput>(null);
  const richText = useRef<RichEditor>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isInitializingRef = useRef(!!editId || autoLoadDraft === 'true'); // 자동 로드 시에도 초기화 방어
  const isEditorFocusedRef = useRef(false);

  const dateObj = new Date(selectedDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = week[dateObj.getDay()];

  // 선택된 폰트 사이즈 계산
  const currentFontSize =
    FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES] || 14;

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const backAction = () => {
      setCancelModalVisible(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (draftModalVisible || cancelModalVisible || emotionModalVisible) {
      Keyboard.dismiss();
      richText.current?.blurContentEditor();
    }
  }, [draftModalVisible, cancelModalVisible, emotionModalVisible]);

  const checkIsEmptyText = (html: string) => {
    const plainText = html
      .replace(/<[^>]*>?/gm, '')
      .replace(/&#8203;/g, '')
      .replace(/\u200B/g, '')
      .trim();
    const hasImage = html.includes('<img');
    return plainText.length === 0 && !hasImage;
  };

  useEffect(() => {
    if (editId) {
      const existingDiary = diaries.find((d) => d.id === editId);
      if (existingDiary) {
        setTitle(existingDiary.title || '');
        if (existingDiary.title) setIsTitleActive(true);

        if (existingDiary.emotions) setSelectedEmotions(existingDiary.emotions);
        else if (existingDiary.emotion)
          setSelectedEmotions([existingDiary.emotion]);

        const content = existingDiary.content || '';
        const isEmpty = checkIsEmptyText(content);
        setIsPlaceholderVisible(isEmpty);
      }
    } else {
      if (draft && draft.date === selectedDate) {
        if (autoLoadDraft === 'true') {
          setTitle(draft.title || '');
          if (draft.title) setIsTitleActive(true);
          setSelectedEmotions(draft.emotions || []);
        } else {
          setTimeout(() => {
            setDraftModalVisible(true);
          }, 1000);
        }
      }
    }
  }, [editId, selectedDate, autoLoadDraft]);

  // 💡 데이터 로드 시 HTML 안의 로컬 파일을 다시 에디터 렌더링용 Base64로 복원
  const handleEditorInit = async () => {
    richText.current?.sendAction(actions.alignLeft, 'result');

    if (editId) {
      const existingDiary = diaries.find((d) => d.id === editId);
      if (existingDiary) {
        isInitializingRef.current = true;
        const loadedHtml = await processHtmlForLoad(
          existingDiary.content || BASE_BLOCK,
        );

        setTimeout(() => {
          richText.current?.setContentHTML(loadedHtml);
          forceLayoutReflow(true);
        }, 500);
      }
    } else if (autoLoadDraft === 'true' && draft) {
      isInitializingRef.current = true;
      const loadedHtml = await processHtmlForLoad(draft.content || BASE_BLOCK);

      setTimeout(() => {
        richText.current?.setContentHTML(loadedHtml);
        setIsPlaceholderVisible(checkIsEmptyText(loadedHtml));
        forceLayoutReflow(true);
      }, 500);
    } else {
      setTimeout(() => {
        richText.current?.setContentHTML(BASE_BLOCK);

        if (draft && draft.date === selectedDate && autoLoadDraft !== 'true') {
          richText.current?.blurContentEditor();
          Keyboard.dismiss();
        }
      }, 300);
    }
  };

  const handleEmotionToggle = (id: string) => {
    if (selectedEmotions.includes(id)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== id));
    } else {
      if (selectedEmotions.length >= 4) {
        const newEmotions = [...selectedEmotions];
        newEmotions[3] = id;
        setSelectedEmotions(newEmotions);
      } else {
        setSelectedEmotions([...selectedEmotions, id]);
      }
    }
  };

  const handleSaveDraft = async () => {
    let currentContent = (await richText.current?.getContentHtml()) || '';

    currentContent = currentContent.replace(
      /<img[^>]*src="dummy_url"[^>]*>/gi,
      '',
    );

    // 💡 저장 전 처리: HTML에서 Base64를 추출하고 기기에 분리 저장
    const processedContent = await processHtmlForSave(currentContent);

    saveDraft({
      date: selectedDate,
      title,
      content: processedContent,
      emotions: selectedEmotions,
    });
    Toast.show({
      type: 'success',
      text1: '일기를 임시저장 했어요',
      position: 'top',
      topOffset: 60,
    });
  };

  const handleSave = async () => {
    if (selectedEmotions.length === 0) {
      Toast.show({
        type: 'info',
        text1: '기분을 한 개 이상 선택해주세요',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    let currentContent = (await richText.current?.getContentHtml()) || '';

    currentContent = currentContent.replace(
      /<img[^>]*src="dummy_url"[^>]*>/gi,
      '',
    );

    const plainText = currentContent
      .replace(/<[^>]*>?/gm, '')
      .replace(/&#8203;/g, '')
      .replace(/\u200B/g, '')
      .trim();

    const hasImage = currentContent.includes('<img');

    if (plainText.length === 0 && !hasImage) {
      Toast.show({
        type: 'info',
        text1: '일기 내용을 작성해주세요',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    clearDraft();

    // 💡 저장 전 처리: HTML에서 Base64를 추출하고 기기에 분리 저장
    const processedContent = await processHtmlForSave(currentContent);

    const diaryData = {
      title,
      content: processedContent,
      emotions: selectedEmotions,
    };

    if (editId) {
      updateDiary(editId as string, diaryData);
    } else {
      addDiary({ ...diaryData, date: selectedDate });
    }

    setTimeout(() => {
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    }, 100);
  };

  const forceLayoutReflow = (isInit = false) => {
    setTimeout(() => {
      const selfDestructingTag = `<img src="dummy_url" style="position: absolute; top: -9999px; left: -9999px;width:0;height:0;display:none;" onerror="this.parentNode.removeChild(this);" />`;
      richText.current?.insertHTML(selfDestructingTag);

      if (isInit) {
        richText.current?.blurContentEditor();
        setTimeout(() => {
          isInitializingRef.current = false;
        }, 1500);
      }
    }, 800);
  };

  const loadDraftData = async () => {
    if (!draft) return;

    setTitle(draft?.title || '');
    if (draft?.title) setIsTitleActive(true);
    setSelectedEmotions(draft?.emotions || []);

    isInitializingRef.current = true;

    // 💡 데이터 로드 시에도 이미지 분리 처리를 거칩니다.
    const loadedHtml = await processHtmlForLoad(draft?.content || BASE_BLOCK);

    setTimeout(() => {
      richText.current?.setContentHTML(loadedHtml);
      setIsPlaceholderVisible(checkIsEmptyText(loadedHtml));
      forceLayoutReflow(true);
    }, 300);
  };

  const handleImagePress = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true, // 에디터에는 Base64로 던져주고, 저장할 때 processHtmlForSave가 처리합니다.
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;

      richText.current?.insertHTML(`
      <div style="margin: 10px 0;">
        <img src="${base64Data}" alt="attached" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
      </div><br/>
    `);

      setIsPlaceholderVisible(false);
      forceLayoutReflow();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const insertCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12 || 12;
    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeStr = `${ampm} ${hours}:${strMinutes}`;
    richText.current?.insertText(timeStr);
  };

  const handleTitleActivate = () => {
    setIsTitleActive(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleTitleReset = () => {
    setTitle('');
    setIsTitleActive(false);
  };

  const changeAlignment = () => {
    let nextAlign: 'left' | 'center' | 'right' = 'left';
    let command = actions.alignLeft;

    if (textAlign === 'left') {
      nextAlign = 'center';
      command = actions.alignCenter;
    } else if (textAlign === 'center') {
      nextAlign = 'right';
      command = actions.alignRight;
    }

    setTextAlign(nextAlign);
    richText.current?.sendAction(command, 'result');
  };

  const getWebFontCss = (fontFamily: string) => {
    switch (fontFamily) {
      case 'NanumSquareRound':
        return "@font-face { font-family: 'NanumSquareRound'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }";
      case 'KyoboHandwriting':
        return "@font-face { font-family: 'KyoboHandwriting'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2604-1@1.1/KyoboHandwriting2025lyb.woff2') format('woff2'); font-weight: normal; font-style: normal; font-display: swap; }";
      case 'GowunBatang':
        return "@font-face { font-family: 'GowunBatang'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/GowunBatang-Regular.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }";
      case 'IsYun':
        return "@font-face { font-family: 'IsYun'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202-2@1.0/LeeSeoyun.woff') format('woff'); font-weight: normal; font-style: normal; font-display: swap; }";
      default:
        return '';
    }
  };

  const showPlusBtn = !isTitleActive && title.length === 0;

  const fadePlus = useRef(new Animated.Value(showPlusBtn ? 1 : 0)).current;
  const fadeMinus = useRef(new Animated.Value(showPlusBtn ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadePlus, {
      toValue: showPlusBtn ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeMinus, {
      toValue: !showPlusBtn ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showPlusBtn]);

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.customHeader,
            isDark && styles.darkCustomHeader,
            { height: 50 + insets.top, paddingTop: insets.top },
          ]}
        >
          <View style={styles.leftIconsWrapper}>
            <AppTouchableOpacity onPress={() => setCancelModalVisible(true)}>
              {editId ? (
                <BackIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              ) : (
                <CloseIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}
            </AppTouchableOpacity>
          </View>
          <View style={styles.rightIconsWrapper}>
            {!editId && (
              <AppTouchableOpacity
                onPress={handleSaveDraft}
                style={styles.headerBtn}
              >
                <AppText style={styles.draftBtnText}>임시저장</AppText>
              </AppTouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            <View style={styles.infoArea}>
              <AppTouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  richText.current?.blurContentEditor();
                  setTimeout(() => {
                    setEmotionModalVisible(true);
                  }, 100);
                }}
                style={styles.selectedEmotionsContainer}
              >
                {selectedEmotions.length > 0 ? (
                  selectedEmotions.map((emotionId) => (
                    <Image
                      key={emotionId}
                      source={
                        ANIMATED_EMOTION_IMAGE_MAP[emotionId] ||
                        EMOTION_IMAGE_MAP[emotionId]
                      }
                      style={styles.topEmotionImage}
                      contentFit="contain"
                    />
                  ))
                ) : (
                  <AddBigIcon
                    width={50}
                    height={50}
                    color={isDark ? '#333' : '#ccc'}
                  />
                )}
              </AppTouchableOpacity>

              <View style={styles.dateBox}>
                <AppText
                  useDiaryFont
                  style={styles.date}
                >{`${year}년 ${month}월 ${day}일`}</AppText>
                <AppText useDiaryFont style={styles.day}>
                  {dayOfWeek}요일
                </AppText>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <AppTextInput
                ref={titleInputRef}
                editable={isTitleActive}
                pointerEvents={isTitleActive ? 'auto' : 'none'}
                style={[
                  styles.titleInput,
                  {
                    fontFamily:
                      diaryFontFamily === 'System'
                        ? undefined
                        : diaryFontFamily,
                    tintColor: isDark ? '#ffffff' : '#111111',
                  },
                ]}
                cursorColor={isDark ? '#ffffff' : '#111111'}
                selectionColor={
                  isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                }
                value={title}
                blurOnSubmit={true}
                multiline={true}
                onChangeText={(val) => setTitle(val.replace(/\n/g, ''))}
              />

              <Animated.View
                style={[styles.addTitleBtn, { opacity: fadePlus }]}
                pointerEvents={showPlusBtn ? 'auto' : 'none'}
              >
                <AppTouchableOpacity
                  activeOpacity={1}
                  onPress={handleTitleActivate}
                  style={styles.plusTouchable}
                >
                  <AppText
                    style={[
                      styles.addTitleText,
                      isDark && styles.darkAddTitleText,
                    ]}
                  >
                    제목
                  </AppText>
                  {isDark ? (
                    <AddDarkIcon width={24} height={24} color={'#333'} />
                  ) : (
                    <AddIcon width={24} height={24} color={'#ccc'} />
                  )}
                </AppTouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[styles.addDisabledTitleBtn, { opacity: fadeMinus }]}
                pointerEvents={!showPlusBtn ? 'auto' : 'none'}
              >
                <AppTouchableOpacity
                  activeOpacity={1}
                  onPress={handleTitleReset}
                  style={styles.minusTouchable}
                >
                  {isDark ? (
                    <MinusDarkIcon width={24} height={24} color={'#333'} />
                  ) : (
                    <MinusIcon width={24} height={24} color={'#ccc'} />
                  )}
                  <AppText
                    style={[
                      styles.addTitleText,
                      isDark && styles.darkAddTitleText,
                    ]}
                  >
                    제목
                  </AppText>
                </AppTouchableOpacity>
              </Animated.View>
            </View>

            <View
              style={[
                styles.editorWrapper,
                { minHeight: Math.max(300, editorHeight) },
              ]}
            >
              {isPlaceholderVisible && (
                <View style={styles.customPlaceholder} pointerEvents="none">
                  <AppText
                    style={{
                      fontFamily:
                        diaryFontFamily === 'System'
                          ? undefined
                          : diaryFontFamily,
                      fontSize: currentFontSize,
                      lineHeight: currentFontSize * 1.5,
                      color: isDark ? '#666666' : '#bbbbbb',
                      textAlign: textAlign,
                    }}
                  >
                    오늘 하루는 어땠나요?
                  </AppText>
                </View>
              )}

              <RichEditor
                ref={richText}
                style={styles.richEditor}
                editorInitializedCallback={handleEditorInit}
                scrollEnabled={false}
                useCharacter={false}
                androidHardwareAccelerationDisabled
                onFocus={() => {
                  isEditorFocusedRef.current = true;
                }}
                onBlur={() => {
                  isEditorFocusedRef.current = false;
                }}
                onHeightChange={(height) => {
                  setEditorHeight(height + 50);
                }}
                onCursorPosition={(scrollY) => {
                  if (isInitializingRef.current || !isEditorFocusedRef.current)
                    return;

                  scrollViewRef.current?.scrollTo({
                    y: scrollY,
                    animated: true,
                  });
                }}
                onChange={(html) => {
                  if (isInitializingRef.current) return;

                  setIsPlaceholderVisible(checkIsEmptyText(html));

                  const isTagEmpty =
                    html === '' ||
                    html === '<br>' ||
                    html === '<p><br></p>' ||
                    html === '<div></div>' ||
                    html === '<p></p>';

                  if (isTagEmpty) {
                    richText.current?.setContentHTML(BASE_BLOCK);
                  }
                }}
                editorStyle={{
                  backgroundColor: isDark ? '#111111' : '#FCFBFA',
                  color: isDark ? '#ffffff' : '#111111',
                  placeholderColor: 'transparent',
                  initialCSSText: `
                    ${getWebFontCss(diaryFontFamily)}
                    img { max-width: 100% !important; height: auto !important; display: block !important; border-radius: 8px !important; margin-top: 10px !important; }
                  `,
                  contentCSSText: `
                    font-size: ${currentFontSize}px !important; 
                    font-family: ${diaryFontFamily === 'System' ? 'sans-serif' : `'${diaryFontFamily}', sans-serif`} !important; 
                    line-height: 1.5 !important; 
                    caret-color: ${isDark ? '#ffffff' : '#111111'} !important;
                  `,
                }}
                useContainer={true}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomArea,
            isDark && styles.darkBottomArea,
            {
              height: 50 + (isKeyboardVisible ? 0 : insets.bottom),
              paddingBottom: isKeyboardVisible ? 0 : insets.bottom,
            },
          ]}
        >
          <View style={styles.toolbar}>
            <AppTouchableOpacity
              onPress={changeAlignment}
              style={styles.toolBtn}
            >
              {textAlign === 'left' && (
                <AlignLeftIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}
              {textAlign === 'center' && (
                <AlignCenterIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}
              {textAlign === 'right' && (
                <AlignRightIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}
            </AppTouchableOpacity>
            <AppTouchableOpacity
              onPress={handleImagePress}
              style={styles.toolBtn}
            >
              <ImageIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>
            <AppTouchableOpacity
              onPress={insertCurrentTime}
              style={styles.toolBtn}
            >
              <ClockIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>
          </View>
          <AppTouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <WriteIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <AppConfirmModal
        visible={draftModalVisible}
        title="임시저장 불러오기"
        message={
          '작성 중인 일기가 있어요.\n이어서 작성할까요?\n\n* 새로 작성시, 임시 글은 지워집니다.'
        }
        cancelText="새로 작성"
        confirmText="이어서 작성"
        onCancel={() => {
          setDraftModalVisible(false);
          clearDraft();
          richText.current?.setContentHTML(BASE_BLOCK);
          setIsPlaceholderVisible(true);
        }}
        onConfirm={() => {
          setDraftModalVisible(false);
          loadDraftData();
        }}
        closeOnOverlayPress={false}
      />

      <AppConfirmModal
        visible={cancelModalVisible}
        title={!editId ? '작성 취소' : '수정 취소'}
        message={
          !editId
            ? '일기를 그만 쓰시나요?\n작성 중인 일기가 저장되지 않아요.\n\n* 이어서 작성하려면 임시저장을 해주세요.'
            : '일기 수정을 취소할까요?\n일기가 원래 작성된 내용으로 유지돼요.'
        }
        cancelText="계속 작성하기"
        confirmText="나가기"
        confirmColor="#FF6F61"
        onCancel={() => setCancelModalVisible(false)}
        onConfirm={() => {
          setCancelModalVisible(false);
          if (editId) {
            router.back();
          } else {
            if (router.canDismiss()) router.dismissAll();
            router.replace('/');
          }
        }}
        reverseButtons={true}
      />

      <EmotionSelectModal
        visible={emotionModalVisible}
        onClose={() => setEmotionModalVisible(false)}
        selectedEmotions={selectedEmotions}
        onClearEmotions={() => setSelectedEmotions([])}
        onToggleEmotion={handleEmotionToggle}
        isDark={isDark}
      />
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
  darkCustomHeader: { backgroundColor: '#111111' },
  headerBtn: { justifyContent: 'center', alignItems: 'center' },
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
  draftBtnText: { fontSize: 14, color: '#FF6262' },
  contentWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 0,
  },
  infoArea: { alignItems: 'center', gap: 10 },
  selectedEmotionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
  },
  topEmotionImage: {
    width: 50,
    height: 50,
  },
  emotionFallback: {
    fontSize: 16,
  },

  emotion: { fontSize: 50 },
  dateBox: { alignItems: 'center', gap: 4 },
  date: { fontSize: 14, lineHeight: 16 },
  day: { fontSize: 14, color: '#666', lineHeight: 16 },

  addTitleText: { fontSize: 14, color: '#ccc', fontWeight: '600' },
  darkAddTitleText: { color: '#333' },

  inputWrapper: {
    width: '100%',
    position: 'relative',
  },
  plusTouchable: {
    flex: 1, // 부모 뷰 크기를 꽉 채움
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTitleBtn: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  addDisabledTitleBtn: {
    position: 'absolute',
    top: -5,
    left: -2,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    minHeight: 32,
    textAlign: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom: 40,
    paddingHorizontal: 5,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center', // 안드로이드에서 텍스트가 위아래로 흔들리는 것을 방지
  },

  editorWrapper: {
    position: 'relative',
    width: '100%',
    minHeight: 300,
  },
  customPlaceholder: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },

  bottomArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FCFBFA',
  },
  darkBottomArea: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#111111',
  },
  toolbar: { flexDirection: 'row', gap: 10 },
  toolBtn: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  submitBtn: { justifyContent: 'center', alignItems: 'center' },

  richEditor: {
    minHeight: 300,
    width: '100%',
  },
});
