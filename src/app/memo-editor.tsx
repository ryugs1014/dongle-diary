import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
  AppState,
  Modal,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  TenTapStartKit,
  CoreBridge,
  PlaceholderBridge,
  ImageBridge,
  useBridgeState,
} from '@10play/tentap-editor';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  AddBigIcon,
  BackIcon,
  OptionIcon,
  UndoIcon,
  RedoIcon,
  WriteIcon,
  LockIcon,
} from '@/assets/icons';
import { useMemoStore, MemoFile } from '../store/useMemoStore';
import { useDiaryStore } from '@/store/useDiaryStore';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import {
  saveClipboardImage,
  copyImageToMemoFolder,
  IMAGE_DIR,
} from '@/utils/image';

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

// 🟢 [저장/로드 유틸] 컴포넌트 밖으로 분리하여 깔끔하게 만듭니다.
const processHtmlForSave = async (html: string) => {
  let processedHtml = html;
  const regex = /src="(data:image\/([^;]+);base64,([^"]+))"/gi;
  const matches = [...html.matchAll(regex)];

  for (const match of matches) {
    const fullSrc = match[1];
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const base64Data = match[3];

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
    }

    processedHtml = processedHtml.replace(fullSrc, fileUri);
  }
  return processedHtml;
};

const processHtmlForLoad = async (html: string) => {
  if (!html) return '<h1></h1>';
  let processedHtml = html;
  const regex = /src="(file:\/\/[^"]+)"/gi;
  const matches = [...html.matchAll(regex)];

  for (const match of matches) {
    const fullSrc = match[1];
    const fileUri = match[1];

    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const ext = fileUri.split('.').pop() || 'jpg';
        const base64Src = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${base64Data}`;

        processedHtml = processedHtml.replace(fullSrc, base64Src);
      }
    } catch (e) {
      console.log('이미지 로드 실패:', e);
    }
  }
  return processedHtml;
};

// 🌟 1. 최상위 래퍼 컴포넌트: 파일 로딩이 끝날 때까지 기다려줍니다.
export default function MemoEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { memos } = useMemoStore();
  const existingMemo = memos.find((m) => m.id === id);

  const [initialHtml, setInitialHtml] = useState<string | null>(null);

  useEffect(() => {
    const prepareHtml = async () => {
      if (existingMemo?.content) {
        const processed = await processHtmlForLoad(existingMemo.content);
        setInitialHtml(processed);
      } else {
        setInitialHtml('<h1></h1>');
      }
    };
    prepareHtml();
  }, [existingMemo?.content]);

  // 준비되기 전에는 배경색만 띄워서 화면 깜빡임을 방지합니다.
  if (initialHtml === null) {
    return <View style={{ flex: 1, backgroundColor: '#FCFBFA' }} />;
  }

  // 데이터 준비가 완료되면 에디터를 마운트시킵니다.
  return (
    <MemoEditor initialHtml={initialHtml} existingMemo={existingMemo} id={id} />
  );
}

// 🌟 2. 실제 에디터 컴포넌트 (준비된 initialHtml을 전달받습니다)
function MemoEditor({
  initialHtml,
  existingMemo,
  id,
}: {
  initialHtml: string;
  existingMemo: any;
  id: string | undefined;
}) {
  const insets = useSafeAreaInsets();
  const { theme, diaryFontFamily } = useDiaryStore();
  const { addMemo, updateMemo, deleteMemo, activeFolderId, moveToTrash } =
    useMemoStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [files, setFiles] = useState<MemoFile[]>(existingMemo?.files || []);
  const filesRef = useRef(files);

  const currentIdRef = useRef(id || Date.now().toString());
  const isNewRef = useRef(!id);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMemoState = existingMemo;

  const editorTheme = {
    webview: { backgroundColor: isDark ? '#111111' : '#FCFBFA' },
    editor: {
      backgroundColor: isDark ? '#111111' : '#FCFBFA',
      color: isDark ? '#ffffff' : '#111111',
      placeholder: { color: isDark ? '#aaaaaa' : '#999999' },
    },
    toolbar: {
      toolbarBody: { backgroundColor: isDark ? '#111111' : '#ffffff' },
      toolbarButton: { backgroundColor: isDark ? '#111111' : '#ffffff' },
      iconWrapperActive: { backgroundColor: isDark ? '#333333' : '#e5e5e5' },
      icon: { tintColor: isDark ? '#ffffff' : '#111111' },
    },
  };

  const fontCss = getWebFontCss(diaryFontFamily);
  const fontFamilyRule =
    diaryFontFamily !== 'System'
      ? `font-family: '${diaryFontFamily}', sans-serif !important;`
      : '';
  const textColor = isDark ? '#ffffff' : '#111111';

  const customCss = `
    ${fontCss}
    * {
      ${fontFamilyRule}
      color: ${textColor} !important;
    }
    .ProseMirror {
      padding: 20px 20px !important;
      min-height: 100%;
      font-size: 18px;
    }
    .ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, 
    .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, 
    .ProseMirror ul, .ProseMirror ol {
      margin-top: 0px !important;
      margin-bottom: 4px !important;
    }
    img {
      width: 100%;
      min-height: 150px;
      background-color: #e1e2e3; 
      object-fit: contain;
      border-radius: 8px;
      margin-top: 10px;
      margin-bottom: 10px;
      display: block;
    }
  `;

  // 🔥 이제 한 번에 완벽한 내용으로 에디터를 초기화합니다.
  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: false,
    editable: !currentMemoState?.isLocked,
    initialContent: initialHtml,
    theme: editorTheme,
    bridgeExtensions: [
      ...TenTapStartKit,
      ImageBridge,
      CoreBridge.configureCSS(customCss),
      PlaceholderBridge.configureExtension({
        placeholder: '내용을 입력하세요',
      }),
    ],
    onChange: () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => performSave(), 1000);
    },
  });

  const editorState = useBridgeState(editor);

  // useEffect 내에 있던 setContent 로직 삭제 완료!

  useEffect(() => {
    filesRef.current = files;
    if (editorState.isReady) {
      performSave();
    }
  }, [files]);

  const isPickingFile = useRef(false);

  const performSave = async () => {
    if (!editor) return;
    const htmlContent = await editor.getHTML();

    const processedHtml = await processHtmlForSave(htmlContent);

    const textWithBreaks = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');

    const lines = textWithBreaks
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (
      lines.length === 0 &&
      !htmlContent.includes('<img') &&
      filesRef.current.length === 0
    ) {
      if (!isNewRef.current) {
        deleteMemo(currentIdRef.current);
      }
      return;
    }

    let title = '새 메모';
    if (lines.length > 0) {
      title = lines[0];
    } else if (htmlContent.includes('<img')) {
      title = '사진 메모';
    } else if (filesRef.current.length > 0) {
      title = '파일 첨부 메모';
    }

    const previewText = lines.slice(1).join(' ');
    let preview = previewText;

    if (previewText.length === 0) {
      if (htmlContent.includes('<img')) preview = '이미지가 포함되어 있습니다.';
      else if (filesRef.current.length > 0)
        preview = '파일이 첨부되어 있습니다.';
    } else if (previewText.length > 80) {
      preview = previewText.substring(0, 80) + '...';
    }

    const payload = {
      title,
      content: processedHtml,
      preview,
      files: filesRef.current,
    };

    if (isNewRef.current) {
      addMemo({
        id: currentIdRef.current,
        ...payload,
        folderId: activeFolderId === 'uncategorized' ? null : activeFolderId,
      });
      isNewRef.current = false;
    } else {
      updateMemo(currentIdRef.current, payload);
    }
  };

  const isFocusTriggered = useRef(false);

  useEffect(() => {
    if (!existingMemo && editorState.isReady && !isFocusTriggered.current) {
      isFocusTriggered.current = true;
      setTimeout(() => editor.focus('end'), 400);
    }
  }, [existingMemo, editorState.isReady, editor]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) performSave();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      appStateSub.remove();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor]);

  const handleAttachImage = () => {
    setMenuVisible(false);
    if (currentMemoState?.isLocked) return;

    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });

        if (result.canceled || result.assets.length === 0) return;

        const asset = result.assets[0];
        const base64Uri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
        editor?.setImage(base64Uri);

        setTimeout(() => editor?.focus('end'), 100);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: '사진을 불러오는 중 오류가 발생했습니다.',
        });
      }
    }, 300);
  };

  const handlePasteImage = () => {
    setMenuVisible(false);
    if (currentMemoState?.isLocked) return;

    setTimeout(async () => {
      const hasImage = await Clipboard.hasImageAsync();
      if (hasImage) {
        try {
          const image = await Clipboard.getImageAsync({
            format: 'jpeg',
            jpegQuality: 0.7,
          });
          if (image && image.data) {
            const cleanBase64 = image.data.replace(
              /^data:image\/\w+;base64,/,
              '',
            );
            const base64Uri = `data:image/jpeg;base64,${cleanBase64}`;

            editor?.setImage(base64Uri);
            setTimeout(() => editor?.focus('end'), 100);
          }
        } catch (error) {
          Toast.show({ type: 'error', text1: '오류가 발생했습니다.' });
        }
      }
    }, 300);
  };

  const handleAttachFile = () => {
    setMenuVisible(false);

    if (currentMemoState?.isLocked) {
      Toast.show({ type: 'error', text1: '잠긴 메모는 수정할 수 없습니다.' });
      return;
    }

    setTimeout(async () => {
      if (isPickingFile.current) return;

      try {
        isPickingFile.current = true;
        const result = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newFile = {
            uri: result.assets[0].uri,
            name: result.assets[0].name,
            mimeType: result.assets[0].mimeType,
          };
          setFiles((prev) => [...prev, newFile]);
        }
      } catch (error) {
        console.log('File pick error:', error);
      } finally {
        isPickingFile.current = false;
      }
    }, 300);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    if (currentMemoState?.isLocked) {
      Toast.show({ type: 'error', text1: '잠긴 메모는 수정할 수 없습니다.' });
      return;
    }
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDone = () => {
    performSave();
    Keyboard.dismiss();
    editor?.blur();
  };

  const handleBack = async () => {
    await performSave();
    router.back();
  };

  const renderHeader = () => {
    if (isSearchVisible) {
      return (
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="메모 내에서 찾기..."
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          <AppTouchableOpacity onPress={() => setIsSearchVisible(false)}>
            <AppText style={styles.headerBtnText}>닫기</AppText>
          </AppTouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={handleBack}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
        <View style={styles.rightIconsWrapper}>
          {currentMemoState?.isLocked && (
            <LockIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          )}
          {!currentMemoState?.isLocked && (
            <>
              <AppTouchableOpacity onPress={() => editor?.undo()}>
                <UndoIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              </AppTouchableOpacity>
              <AppTouchableOpacity onPress={() => editor?.redo()}>
                <RedoIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              </AppTouchableOpacity>
            </>
          )}

          <AppTouchableOpacity onPress={() => setMenuVisible(true)}>
            <OptionIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>

          {isKeyboardVisible && (
            <AppTouchableOpacity onPress={handleDone}>
              <WriteIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {files.length > 0 && (
          <View
            style={[styles.filesContainer, isDark && styles.darkFilesContainer]}
          >
            {files.map((file, index) => (
              <View
                key={index}
                style={[styles.fileChip, isDark && styles.darkFileChip]}
              >
                <AppText
                  style={[styles.fileName, isDark && styles.darkFileName]}
                  numberOfLines={1}
                >
                  📄 {file.name}
                </AppText>
                <AppTouchableOpacity onPress={() => handleRemoveFile(index)}>
                  <AppText style={styles.fileRemoveBtn}>✕</AppText>
                </AppTouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <RichText
          editor={editor}
          webviewProps={{
            originWhitelist: ['*'],
            allowFileAccess: true,
            allowFileAccessFromFileURLs: true,
            allowUniversalAccessFromFileURLs: true,
            mixedContentMode: 'always',
            allowingReadAccessToURL: FileSystem.documentDirectory,
          }}
        />

        <View
          style={[
            styles.customKeyboardHeader,
            isDark && styles.darkCustomKeyboardHeader,
            {
              height: insets.top,
              display: isKeyboardVisible ? 'flex' : 'none',
            },
          ]}
        >
          <Toolbar
            editor={editor}
            hidden={!isKeyboardVisible}
            style={[styles.toolbar, isDark && styles.darkToolbar]}
          />
        </View>
      </KeyboardAvoidingView>

      {!isKeyboardVisible && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }} />
          <AppTouchableOpacity
            onPress={async () => {
              await performSave();
              router.push('/memo-editor');
            }}
          >
            <AddBigIcon width={40} height={40} color="#007AFF" />
          </AppTouchableOpacity>
        </View>
      )}

      <Modal visible={isMenuVisible} transparent animationType="fade">
        <AppTouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuBox, isDark && styles.darkMenuBox]}>
            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={handleAttachImage}
            >
              <AppText>사진 첨부하기</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={handlePasteImage}
            >
              <AppText>복사한 이미지 붙여넣기</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={handleAttachFile}
            >
              <AppText>파일 첨부하기</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                updateMemo(currentIdRef.current, {
                  isPinned: !currentMemoState?.isPinned,
                });
                setMenuVisible(false);
              }}
            >
              <AppText>
                {currentMemoState?.isPinned ? '고정 해제' : '메모 고정'}
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                updateMemo(currentIdRef.current, {
                  isLocked: !currentMemoState?.isLocked,
                });
                setMenuVisible(false);
              }}
            >
              <AppText>
                {currentMemoState?.isLocked ? '잠금 해제' : '메모 잠금'}
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                setIsSearchVisible(true);
              }}
            >
              <AppText>메모 안에서 찾기</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                if (currentMemoState?.isLocked) {
                  Toast.show({
                    type: 'error',
                    text1: '잠긴 메모는 삭제할 수 없습니다.',
                    position: 'top',
                    topOffset: 60,
                  });
                  return;
                }
                moveToTrash(currentIdRef.current);
                router.back();
              }}
            >
              <AppText style={{ color: 'red' }}>삭제</AppText>
            </AppTouchableOpacity>
          </View>
        </AppTouchableOpacity>
      </Modal>
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
  leftIconsWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightIconsWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customKeyboardHeader: {},
  darkCustomKeyboardHeader: { backgroundColor: '#111111' },
  toolbar: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  darkToolbar: { backgroundColor: '#111111', borderTopColor: '#333' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f3',
  },
  headerBtnText: { fontSize: 16, color: '#666' },
  searchInput: { flex: 1, marginRight: 10, fontSize: 16, paddingVertical: 5 },
  keyboardContainer: { flex: 1 },
  filesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f3',
  },
  darkFilesContainer: { borderTopColor: '#333' },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '100%',
  },
  darkFileChip: { backgroundColor: '#2a2a2a' },
  fileName: { fontSize: 13, color: '#333', maxWidth: 200 },
  darkFileName: { color: '#eee' },
  fileRemoveBtn: {
    color: '#ff4444',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#f1f1f1',
    backgroundColor: '#FCFBFA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuBox: {
    backgroundColor: '#ffffff',
    width: 220,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f2f3' },
  lastMenuItem: { borderBottomWidth: 0 },
  darkMenuItem: { borderBottomColor: '#333' },
});
