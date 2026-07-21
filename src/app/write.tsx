import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Alert,
  useColorScheme,
  Image,
} from 'react-native';
import AppText from '@/components/AppText';
import AppTextInput from '@/components/AppTextInput';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  CloseIcon,
  ImageIcon,
  ClockIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  WriteIcon,
} from '../../assets/icons';
import { actions, RichEditor } from 'react-native-pell-rich-editor';
import { EMOTIONS_DATA, EMOTION_IMAGE_MAP } from '@/constants/emotions';
import { FONT_SIZES } from '@/constants/font';

// 💡 지워지지 않는 기본 블록 상수화 (좌측 정렬 + 빈 줄)
const BASE_BLOCK = '<div style="text-align: left;"><br></div>';

export default function WriteScreen() {
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams();
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
  const [isTitleActive, setIsTitleActive] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [editorHeight, setEditorHeight] = useState(300);

  // 💡 커스텀 Placeholder의 표시 여부를 관리하는 State
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(!editId);

  const titleInputRef = useRef<TextInput>(null);
  const richText = useRef<RichEditor>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isInitializingRef = useRef(!!editId);
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

  // 💡 텍스트가 완전히 비어있는지 체크하는 유틸리티 함수
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

        // 💡 핵심: 기존 데이터가 있으면 처음에는 무조건 false로 설정합니다.
        // 데이터가 없는 경우에만(빈 일기 등) true로 설정합니다.
        const content = existingDiary.content || '';
        const isEmpty = checkIsEmptyText(content);
        setIsPlaceholderVisible(isEmpty);
        // 내용이 비어있는지에 따라 Placeholder 켜기/끄기
        // setIsPlaceholderVisible(checkIsEmptyText(existingDiary.content || ''));
      }
    } else {
      if (draft && draft.date === selectedDate) {
        Alert.alert(
          '임시저장 불러오기',
          '작성 중이던 일기가 있습니다. 이어서 작성하시겠습니까?',
          [
            {
              text: '새로 작성',
              style: 'cancel',
              onPress: () => {
                clearDraft();
                richText.current?.setContentHTML(BASE_BLOCK);
                setIsPlaceholderVisible(true);
              },
            },
            {
              text: '이어서 작성',
              onPress: () => {
                setTitle(draft.title);
                if (draft.title) setIsTitleActive(true);
                setSelectedEmotions(draft.emotions);

                setTimeout(() => {
                  richText.current?.setContentHTML(draft.content || BASE_BLOCK);
                  setIsPlaceholderVisible(
                    checkIsEmptyText(draft.content || ''),
                  );
                }, 100);
              },
            },
          ],
        );
      }
    }
  }, [editId, selectedDate]);

  const handleEditorInit = () => {
    richText.current?.sendAction(actions.alignLeft, 'result');

    if (editId) {
      const existingDiary = diaries.find((d) => d.id === editId);
      if (existingDiary) {
        isInitializingRef.current = true; // 💡 여기서 스크롤 잠금!

        setTimeout(() => {
          richText.current?.setContentHTML(existingDiary.content || BASE_BLOCK);

          forceLayoutReflow(true); // 💡 초기화 중임을 알려줌
        }, 500);
      }
    } else {
      setTimeout(() => {
        richText.current?.setContentHTML(BASE_BLOCK);
      }, 300);
    }
  };

  const handleEmotionToggle = (id: string) => {
    if (selectedEmotions.includes(id)) {
      // 이미 선택된 감정을 다시 누르면 해제
      setSelectedEmotions(selectedEmotions.filter((e) => e !== id));
    } else {
      if (selectedEmotions.length >= 4) {
        // 💡 경고창(Alert)을 띄우지 않고, 4번째 감정을 새로운 감정으로 교체합니다.
        const newEmotions = [...selectedEmotions];
        newEmotions[3] = id;
        setSelectedEmotions(newEmotions);
      } else {
        // 4개 미만일 때는 자연스럽게 추가
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

    saveDraft({
      date: selectedDate,
      title,
      content: currentContent,
      emotions: selectedEmotions,
    });
    Alert.alert('알림', '임시저장 되었습니다.');
  };

  const handleSave = async () => {
    if (selectedEmotions.length === 0) {
      Alert.alert('알림', '오늘의 기분을 최소 한 개 이상 선택해주세요.');
      return;
    }

    let currentContent = (await richText.current?.getContentHtml()) || '';

    // 💡 저장 직전에 dummy_url 더미 이미지 태그를 문자열에서 완전히 삭제!
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
      Alert.alert('알림', '일기 본문을 작성해주세요.');
      return;
    }

    clearDraft();

    const diaryData = {
      title,
      content: currentContent,
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
      // 1. 투명하고 크기가 없는 더미 이미지를 에디터에 밀어 넣습니다.
      // 2. 존재하지 않는 주소(dummy_url)이므로 에러(onerror)가 즉시 발생합니다.
      // 3. 에러 발생 시 스스로를 DOM에서 완벽하게 삭제(removeChild)합니다.
      // => 결과적으로 정렬이나 텍스트에는 1%도 영향을 주지 않고, 웹뷰의 강제 높이 재계산만 발생합니다!
      const selfDestructingTag = `<img src="dummy_url" style="position: absolute; top: -9999px; left: -9999px;width:0;height:0;display:none;" onerror="this.parentNode.removeChild(this);" />`;
      richText.current?.insertHTML(selfDestructingTag);

      if (isInit) {
        // 초기화 중에 삽입 명령어가 실행되면서 포커스를 빼앗지 못하도록 방어
        richText.current?.blurContentEditor();

        setTimeout(() => {
          isInitializingRef.current = false;
        }, 1500);
      }
    }, 800);
  };

  const handleImagePress = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;

      richText.current?.insertHTML(`
      <div style="margin: 10px 0;">
        <img src="${base64Data}" alt="attached" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
      </div><br/>
    `);

      setIsPlaceholderVisible(false);

      // 💡 이미지가 삽입된 후에도 레이아웃 강제 새로고침
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
            <TouchableOpacity onPress={() => setCancelModalVisible(true)}>
              <CloseIcon
                width={28}
                height={28}
                color={isDark ? 'white' : 'black'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.rightIconsWrapper}>
            <TouchableOpacity
              onPress={handleSaveDraft}
              style={styles.headerBtn}
            >
              <AppText style={styles.draftBtnText}>임시저장</AppText>
            </TouchableOpacity>
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
              <TouchableOpacity
                // onPress={() => setEmotionModalVisible(true)}
                onPress={() => {
                  // 💡 모달을 열기 전에 키보드를 내리고 에디터 포커스를 완벽히 해제합니다.
                  Keyboard.dismiss();
                  richText.current?.blurContentEditor();

                  // 약간의 딜레이를 주어 키보드가 내려간 후 모달이 뜨도록 처리
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
                      source={EMOTION_IMAGE_MAP[emotionId]}
                      style={styles.topEmotionImage}
                      resizeMode="contain"
                    />
                  ))
                ) : (
                  <AppText style={styles.emotionFallback}>➕</AppText>
                )}
              </TouchableOpacity>

              <View style={styles.dateBox}>
                <AppText
                  style={styles.date}
                >{`${year}년 ${month}월 ${day}일`}</AppText>
                <AppText style={styles.day}>{dayOfWeek}요일</AppText>
              </View>
            </View>

            {!isTitleActive && title.length === 0 ? (
              <TouchableOpacity
                style={[styles.addTitleBtn, isDark && styles.darkAddTitleBtn]}
                onPress={handleTitleActivate}
              >
                <AppText
                  style={[
                    styles.addTitleText,
                    isDark && styles.darkAddTitleText,
                  ]}
                >
                  제목 +
                </AppText>
              </TouchableOpacity>
            ) : (
              <AppTextInput
                ref={titleInputRef}
                style={[
                  styles.titleInput,
                  {
                    height: 'auto',
                    fontFamily:
                      diaryFontFamily === 'System'
                        ? undefined
                        : diaryFontFamily,
                  },
                ]}
                cursorColor={isDark ? '#fff' : '#000'}
                selectionColor={isDark ? '#fff' : '#000'}
                value={title}
                blurOnSubmit={true}
                multiline={true}
                onChangeText={(val) => setTitle(val.replace(/\n/g, ''))}
              />
            )}

            {/* 💡 에디터와 커스텀 Placeholder를 겹치기 위한 래퍼(Wrapper) */}
            <View
              style={[
                styles.editorWrapper,
                { minHeight: Math.max(300, editorHeight) },
              ]}
            >
              {/* 💡 커스텀 Placeholder
                  pointerEvents="none" 속성 덕분에
                  플레이스홀더 영역을 터치해도 그 뒤의 에디터가 정상적으로 포커스됩니다. */}
              {isPlaceholderVisible && (
                <View style={styles.customPlaceholder} pointerEvents="none">
                  <AppText
                    style={{
                      fontFamily:
                        diaryFontFamily === 'System'
                          ? undefined
                          : diaryFontFamily,
                      fontSize: currentFontSize,
                      // 에디터와 동일하게 줄간격 1.5배 적용
                      lineHeight: currentFontSize * 1.5,
                      color: isDark ? '#666666' : '#bbbbbb', // 다크모드에 맞춰 자연스럽게 변경
                      // 💡 에디터의 정렬 상태(left, center, right)를 그대로 따라가게 합니다!
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

                // 💡 1. 에디터를 터치하면 포커스 상태 켜기
                onFocus={() => {
                  isEditorFocusedRef.current = true;
                }}

                // 💡 2. 에디터 밖을 터치(키보드 닫힘 등)하면 포커스 끄기
                onBlur={() => {
                  isEditorFocusedRef.current = false;
                }}

                // 💡 4. 웹뷰 내부 높이가 변할 때 React Native 부모 컴포넌트 강제 리렌더링
                onHeightChange={(height) => {
                  // 50px 정도 여유 공간을 더해주어 하단 커서 잘림을 완벽히 방지
                  setEditorHeight(height + 50);
                }}

                // 💡 5. 공식 문서 해결책 적용: 커서 이동 시 해당 위치로 자동 스크롤
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

                  // 1. Placeholder 가시성 업데이트 로직
                  setIsPlaceholderVisible(checkIsEmptyText(html));

                  // 2. 안드로이드 백스페이스 방어 로직
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
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  placeholderColor: 'transparent', // 💡 기존 Placeholder는 완벽히 숨김
                  initialCSSText: `
                    ${getWebFontCss(diaryFontFamily)}
                    img { max-width: 100% !important; height: auto !important; display: block !important; border-radius: 8px !important; margin-top: 10px !important; }
                  `,
                  contentCSSText: `
                    font-size: ${currentFontSize}px !important; 
                    font-family: ${diaryFontFamily === 'System' ? 'sans-serif' : `'${diaryFontFamily}', sans-serif`} !important; 
                    line-height: 1.5 !important; 
                    caret-color: ${isDark ? '#ffffff' : '#000000'} !important;
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
            <TouchableOpacity onPress={changeAlignment} style={styles.toolBtn}>
              {textAlign === 'left' && (
                <AlignLeftIcon
                  width={28}
                  height={28}
                  color={isDark ? 'white' : 'black'}
                />
              )}
              {textAlign === 'center' && (
                <AlignCenterIcon
                  width={28}
                  height={28}
                  color={isDark ? 'white' : 'black'}
                />
              )}
              {textAlign === 'right' && (
                <AlignRightIcon
                  width={28}
                  height={28}
                  color={isDark ? 'white' : 'black'}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImagePress} style={styles.toolBtn}>
              <ImageIcon
                width={28}
                height={28}
                color={isDark ? 'white' : 'black'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={insertCurrentTime}
              style={styles.toolBtn}
            >
              <ClockIcon
                width={28}
                height={28}
                color={isDark ? 'white' : 'black'}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <WriteIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <AppText style={styles.alertTitle}>작성 중지</AppText>
            <AppText style={styles.alertMessage}>
              임시저장 하지 않으면, 작성한 글이 저장되지 않습니다.
            </AppText>
            <View style={styles.alertButtonsCol}>
              <TouchableOpacity
                style={styles.alertBtnCol}
                onPress={() => setCancelModalVisible(false)}
              >
                <AppText style={styles.alertBtnText}>계속 작성하기</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alertBtnCol,
                  { borderTopWidth: 1, borderColor: '#eee' },
                ]}
                onPress={() => {
                  setCancelModalVisible(false);
                  if (router.canDismiss()) router.dismissAll();
                  router.replace('/');
                }}
              >
                <AppText style={[styles.alertBtnText, { color: 'red' }]}>
                  나가기
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={emotionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.emotionBox}>
            <AppText style={styles.modalTitle}>오늘의 기분 (최대 4개)</AppText>
            <ScrollView
              style={styles.emotionScrollView}
              contentContainerStyle={styles.emotionScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.grid}>
                {EMOTIONS_DATA.map((emotion) => {
                  const isSelected = selectedEmotions.includes(emotion.id);
                  return (
                    <TouchableOpacity
                      key={emotion.id}
                      style={[
                        styles.emojiBtn,
                        isSelected && styles.selectedBtn,
                      ]}
                      onPress={() => handleEmotionToggle(emotion.id)}
                    >
                      <Image
                        source={emotion.source}
                        style={styles.modalEmotionImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setEmotionModalVisible(false)}
            >
              <AppText style={{ fontWeight: 'bold' }}>선택 완료</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  darkCustomHeader: { backgroundColor: '#121212' },
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
  // 💡 선택된 감정들을 나란히 보여주기 위한 래퍼
  selectedEmotionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
  },
  // 💡 화면 상단 정보 영역에 보여지는 감정 이미지
  topEmotionImage: {
    width: 50,
    height: 50,
  },
  emotionFallback: {
    fontSize: 16,
  },

  emotion: { fontSize: 50 },
  dateBox: { alignItems: 'center', gap: 4 },
  date: { fontSize: 14 },
  day: { fontSize: 14, color: '#666' },
  addTitleBtn: {
    height: 32,
    marginTop: 24,
    marginBottom: 43,
    // marginVertical: 39,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  addTitleText: { fontSize: 14, color: '#666', fontWeight: '600' },
  darkAddTitleText: { color: '#cccccc' },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    minHeight: 32,
    textAlign: 'center',
    width: '100%',
    paddingBottom: 40,
    marginTop: 24,
    paddingHorizontal: 10,
  },

  // 💡 Placeholder 래퍼 추가
  editorWrapper: {
    position: 'relative',
    width: '100%',
    minHeight: 300,
  },
  customPlaceholder: {
    position: 'absolute',
    top: 10, // 💡 기기별로 텍스트 시작 높이(웹뷰 기본 패딩)가 다를 수 있으니 이 수치를 미세조정(예: 8~14) 하세요.
    left: 10, // 💡 좌측 여백 미세조정
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#ffffff',
  },
  darkBottomArea: {
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: '#111111',
  },
  toolbar: { flexDirection: 'row', gap: 10 },
  toolBtn: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  submitBtn: { justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emotionBox: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  // 💡 새롭게 추가된 스크롤 뷰 스타일
  emotionScrollView: {
    maxHeight: 300, // 모달의 최대 높이를 제한하여 화면을 꽉 채우지 않게 합니다.
    width: '100%',
  },
  emotionScrollContent: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 230,
    paddingTop: 54,
    paddingBottom: 124,
    marginHorizontal: 'auto',
  },

  emojiBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
  },
  modalEmotionImage: {
    width: 50,
    height: 50,
  },

  selectedBtn: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  emojiText: { fontSize: 28 },
  closeModalBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
  },
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
  alertButtonsCol: {
    flexDirection: 'column',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  alertBtnCol: { paddingVertical: 15, alignItems: 'center' },
  alertBtnText: { fontSize: 16, color: '#333' },
  richEditor: {
    minHeight: 300,
    width: '100%',
  },
});
