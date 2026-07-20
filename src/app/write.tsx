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

const EMOTIONS = ['😀', '🥰', '😂', '🥲', '😡', '😭', '😎', '😴'];

const FONT_SIZES = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
};

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
  const [content, setContent] = useState('');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(
    'left',
  );

  const [emotionModalVisible, setEmotionModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [isTitleActive, setIsTitleActive] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // 💡 Refs 추가 (부모 스크롤 제어용 scrollViewRef 추가)
  const titleInputRef = useRef<TextInput>(null);
  const richText = useRef<RichEditor>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const dateObj = new Date(selectedDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = week[dateObj.getDay()];

  // 💡 키보드 이벤트 리스너 등록
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
    if (editId) {
      const existingDiary = diaries.find((d) => d.id === editId);
      if (existingDiary) {
        setContent(existingDiary.content || '');
        setTitle(existingDiary.title || '');
        if (existingDiary.title) setIsTitleActive(true);

        if (existingDiary.emotions) setSelectedEmotions(existingDiary.emotions);
        else if (existingDiary.emotion)
          setSelectedEmotions([existingDiary.emotion]);
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
              onPress: () => clearDraft(),
            },
            {
              text: '이어서 작성',
              onPress: () => {
                setContent(draft.content || '');
                setTitle(draft.title);
                if (draft.title) setIsTitleActive(true);
                setSelectedEmotions(draft.emotions);

                // 💡 해결 1: WebView 에디터 내부에 HTML 내용을 강제로 밀어넣기
                setTimeout(() => {
                  richText.current?.setContentHTML(draft.content || '');
                }, 100);
              },
            },
          ],
        );
      }
    }
  }, [editId, selectedDate]);

  const handleEditorInit = () => {
    if (editId) {
      const existingDiary = diaries.find((d) => d.id === editId);
      if (existingDiary) {
        // 이미지가 디코딩되고 그려질 시간을 충분히(0.5초) 준 뒤 기존 내용을 한 번 더 세팅합니다.
        // 이 과정에서 DOM이 업데이트되며 에디터가 잘려있던 이미지 높이를 다시 정상적으로 계산합니다.
        setTimeout(() => {
          richText.current?.setContentHTML(existingDiary.content || '');
        }, 500);
      }
    }
  };

  const handleEmotionToggle = (emoji: string) => {
    if (selectedEmotions.includes(emoji)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emoji));
    } else {
      if (selectedEmotions.length >= 4) {
        Alert.alert('알림', '감정은 최대 4개까지만 선택할 수 있습니다.');
        return;
      }
      setSelectedEmotions([...selectedEmotions, emoji]);
    }
  };

  const handleSaveDraft = () => {
    saveDraft({
      date: selectedDate,
      title,
      content,
      emotions: selectedEmotions,
    });
    Alert.alert('알림', '임시저장 되었습니다.');
  };

  const handleSave = () => {
    if (selectedEmotions.length === 0) {
      Alert.alert('알림', '오늘의 기분을 최소 한 개 이상 선택해주세요.');
      return;
    }

    const plainText = content.replace(/<[^>]*>?/gm, '').trim();
    const hasImage = content.includes('<img');

    if (plainText.length === 0 && !hasImage) {
      Alert.alert('알림', '일기 본문을 작성해주세요.');
      return;
    }

    clearDraft();

    const diaryData = {
      title,
      content,
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

  const handleImagePress = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;

      // 💡 수정된 부분: insertImage 대신 insertHTML 사용
      // 이미지 삽입 후 빈 줄(<br><br>)을 추가해 강제로 에디터 높이 갱신 유도
      richText.current?.insertHTML(`
        <br />
        <img src="${base64Data}" alt="attached" />
        <br /><br />
      `);
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

  const currentFontSize =
    FONT_SIZES[diaryFontSize as keyof typeof FONT_SIZES] || 14;

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
          ref={scrollViewRef} // 💡 ScrollView 레퍼런스 연결
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            <View style={styles.infoArea}>
              <TouchableOpacity onPress={() => setEmotionModalVisible(true)}>
                <AppText style={styles.emotion}>
                  {selectedEmotions.length > 0
                    ? selectedEmotions.join(' ')
                    : '➕'}
                </AppText>
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

            <RichEditor
              ref={richText}
              style={styles.richEditor}
              initialContentHTML={content}
              editorInitializedCallback={handleEditorInit}
              onChange={(html) => setContent(html)}
              placeholder="오늘 하루는 어땠나요?"
              scrollEnabled={false} // 💡 해결 4: 이중 스크롤 방지를 위해 에디터 내부 스크롤 비활성화
              onCursorPosition={(scrollY) => {
                // 💡 해결 3: 타이핑할 때 커서 위치를 따라 부모 ScrollView가 자동으로 내려가도록 처리
                scrollViewRef.current?.scrollTo({
                  y: scrollY - 50, // 감정/날짜/제목 영역의 대략적인 높이만큼 오프셋 추가
                  animated: true,
                });
              }}
              editorStyle={{
                backgroundColor: isDark ? '#111111' : '#ffffff',
                color: isDark ? '#ffffff' : '#000000',
                placeholderColor: '#bbbbbb',
                // 💡 해결 2: 폰트 스타일 설정 (시스템 폰트는 즉시 반영됩니다)
                contentCSSText: `
                  font-size: ${currentFontSize}px; 
                  font-family: ${diaryFontFamily}; 
                  line-height: 1.5; 
                  padding-bottom: 50px;
                  img { 
                    max-width: 100%; 
                    height: auto; 
                    display: block; 
                    border-radius: 8px; 
                    margin-top: 10px;
                  }
                `,
              }}
              useContainer={true}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomArea,
            isDark && styles.darkBottomArea,
            {
              // 💡 키보드가 활성화되었을 때는 하단 안전 영역(insets.bottom)을 제거합니다.
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
            <View style={styles.grid}>
              {EMOTIONS.map((emoji) => {
                const isSelected = selectedEmotions.includes(emoji);
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.emojiBtn, isSelected && styles.selectedBtn]}
                    onPress={() => handleEmotionToggle(emoji)}
                  >
                    <AppText style={styles.emojiText}>{emoji}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  darkCustomHeader: {
    backgroundColor: '#121212',
  },
  headerBtn: {
    justifyContent: 'center',
    alignItems: 'center',
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
  draftBtnText: {
    fontSize: 14,
    color: '#FF6262',
  },

  contentWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 0,
  },
  infoArea: {
    alignItems: 'center',
    gap: 10,
  },
  emotion: { fontSize: 50 },
  dateBox: { alignItems: 'center', gap: 4 },
  date: { fontSize: 14 },
  day: { fontSize: 14, color: '#666' },

  addTitleBtn: {
    height: 32,
    marginVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addTitleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  darkAddTitleText: { color: '#cccccc' },

  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
    minHeight: 32,
    textAlign: 'center',
    width: '100%',
    paddingBottom: 30,
    marginTop: 34,
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
  toolBtn: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },

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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  emojiBtn: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
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
