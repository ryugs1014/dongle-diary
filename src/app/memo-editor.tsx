import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
  AppState,
  useColorScheme,
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
  BackIcon,
  OptionIcon,
  UndoIcon,
  RedoIcon,
  WriteIcon,
  LockIcon,
  AddMemoIcon,
} from '@/assets/icons';
import { useMemoStore, MemoFile } from '../store/useMemoStore';
import { useDiaryStore } from '@/store/useDiaryStore';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { IMAGE_DIR } from '@/utils/image';
import * as Sharing from 'expo-sharing';

// 💡 새롭게 분리한 컴포넌트와 유틸리티 불러오기
import MemoOptionMenu from '@/components/modals/MemoOptionMenu';
import { exportMemoToPdf } from '@/utils/memoPdfExport';
import CustomSpinner from '@/components/common/CustomSpinner';

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
  const regex = /src=["']?([^"'\s>]+)["']?/gi;
  const matches = [...html.matchAll(regex)];

  for (const match of matches) {
    const fullSrc = match[1];
    if (fullSrc.startsWith('data:')) continue;

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
      if (fileInfo.exists && fileInfo.size !== 0) {
        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const ext = targetFileName.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;
        const cleanBase64 = base64Data.replace(/(\r\n|\n|\r|\s)/gm, '');
        const base64Src = `data:image/${mimeType};base64,${cleanBase64}`;
        processedHtml = processedHtml.replace(fullSrc, base64Src);
      }
    } catch (e) {
      console.log(`❌ [로드 중 에러 발생]:`, e);
    }
  }
  return processedHtml;
};

export default function MemoEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { memos } = useMemoStore();
  const existingMemo = memos.find((m) => m.id === id);
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

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

  if (initialHtml === null) {
    return (
      <View
        style={{ flex: 1, backgroundColor: isDark ? '#111111' : '#FCFBFA' }}
      />
    );
  }

  return (
    <MemoEditor initialHtml={initialHtml} existingMemo={existingMemo} id={id} />
  );
}

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
  const { theme, diaryFontFamily, setIsSystemAction } = useDiaryStore(); // 💡 setIsSystemAction 추가
  const { addMemo, updateMemo, deleteMemo, activeFolderId, moveToTrash } =
    useMemoStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // 💡 PDF 내보내기 로딩 상태

  const [files, setFiles] = useState<MemoFile[]>(existingMemo?.files || []);
  const filesRef = useRef(files);

  const currentIdRef = useRef(id || Date.now().toString());
  const isNewRef = useRef(!id);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const isPickingMediaRef = useRef(false);

  const currentMemoState = existingMemo;

  const editorTheme = {
    webview: { backgroundColor: isDark ? '#111111' : '#FCFBFA' },
    editor: {
      backgroundColor: isDark ? '#111111' : '#FCFBFA',
      color: isDark ? '#ffffff' : '#111111',
      placeholder: { color: isDark ? '#aaaaaa' : '#999999' },
    },
    toolbar: {
      toolbarBody: {
        backgroundColor: isDark ? '#111111' : '#ffffff',
        borderTopColor: isDark
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.05)',
        borderBottomColor: 'rgba(0,0,0,0)',
      },
      toolbarButton: { backgroundColor: isDark ? '#111111' : '#ffffff' },
      iconWrapperActive: { backgroundColor: isDark ? '#111111' : '#e5e5e5' },
      icon: { tintColor: isDark ? '#ffffff' : '#111111' },
      iconWrapper: { backgroundColor: isDark ? '#111111' : '#ffffff' },
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
    * { ${fontFamilyRule} color: ${textColor} !important; }
    .ProseMirror { padding: 20px 20px !important; min-height: 100%; font-size: 16px; }
    
    .ProseMirror h1 { font-size: 28px !important; font-weight: normal !important; line-height: 1.3 !important; }
    .ProseMirror h2 { font-size: 24px !important; font-weight: normal !important; line-height: 1.3 !important; }
    .ProseMirror h3 { font-size: 20px !important; font-weight: normal !important; line-height: 1.4 !important; }
    .ProseMirror h4 { font-size: 18px !important; font-weight: normal !important; line-height: 1.4 !important; }
    .ProseMirror h5 { font-size: 16px !important; font-weight: normal !important; line-height: 1.5 !important; }
    
    .ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, 
    .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, 
    .ProseMirror ul, .ProseMirror ol { margin-top: 0px !important; margin-bottom: 4px !important; }
    img { width: 100%; min-height: 150px; background-color: #e1e2e3; object-fit: contain; border-radius: 8px; margin-top: 10px; margin-bottom: 10px; display: block; }
  `;

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

  useEffect(() => {
    filesRef.current = files;
    if (editorState.isReady) performSave();
  }, [files]);

  const isPickingFile = useRef(false);

  const performSave = async () => {
    if (!editor || isSavingRef.current) return;
    isSavingRef.current = true;

    try {
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

      let title = '새 메모';
      if (lines.length > 0) title = lines[0];
      else if (htmlContent.includes('<img')) title = '사진 메모';
      else if (filesRef.current.length > 0) title = '파일 첨부 메모';

      const previewText = lines.slice(1).join(' ');
      let preview = previewText;
      if (previewText.length === 0) {
        if (htmlContent.includes('<img'))
          preview = '이미지가 포함되어 있습니다.';
        else if (filesRef.current.length > 0)
          preview = '파일이 첨부되어 있습니다.';
      } else if (previewText.length > 80) {
        preview = previewText.substring(0, 80) + '...';
      }

      if (
        lines.length === 0 &&
        !htmlContent.includes('<img') &&
        filesRef.current.length === 0
      ) {
        if (!isNewRef.current) deleteMemo(currentIdRef.current);
      } else {
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
            folderId:
              activeFolderId === 'uncategorized' ? null : activeFolderId,
          });
          isNewRef.current = false;
        } else {
          updateMemo(currentIdRef.current, payload);
        }
      }
    } finally {
      isSavingRef.current = false;
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
      if (
        nextAppState.match(/inactive|background/) &&
        !isPickingMediaRef.current
      )
        performSave();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      appStateSub.remove();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor]);

  // 💡 PDF 내보내기 핸들러
  const handleExportPdf = async () => {
    setMenuVisible(false);
    setIsExporting(true);

    try {
      await performSave(); // 현재 타이핑 중인 최신 상태를 반영하기 위해 저장
      const htmlContent = (await editor?.getHTML()) || '';

      const textWithBreaks = htmlContent
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ');
      const lines = textWithBreaks
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      let exportTitle = '새 메모';
      if (lines.length > 0) exportTitle = lines[0];
      else if (htmlContent.includes('<img')) exportTitle = '사진 메모';
      else if (filesRef.current.length > 0) exportTitle = '파일 첨부 메모';

      await exportMemoToPdf(
        exportTitle,
        htmlContent,
        diaryFontFamily,
        setIsSystemAction,
      );
    } catch (error) {
      console.log('PDF 내보내기 실패:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAttachImage = () => {
    setMenuVisible(false);
    if (currentMemoState?.isLocked) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    isPickingMediaRef.current = true;

    setTimeout(async () => {
      try {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          isPickingMediaRef.current = false;
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });

        isPickingMediaRef.current = false;

        if (result.canceled || result.assets.length === 0) return;

        const asset = result.assets[0];
        const base64Uri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
        editor?.setImage(base64Uri);

        setTimeout(() => {
          editor?.focus('end');
          isSavingRef.current = false;
          performSave();
        }, 500);
      } catch (error) {
        isPickingMediaRef.current = false;
        isSavingRef.current = false;
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

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    isPickingMediaRef.current = true;

    setTimeout(async () => {
      try {
        const hasImage = await Clipboard.hasImageAsync();
        if (hasImage) {
          const image = await Clipboard.getImageAsync({
            format: 'jpeg',
            jpegQuality: 0.7,
          });
          isPickingMediaRef.current = false;

          if (image && image.data) {
            isSavingRef.current = true;
            Toast.show({ type: 'info', text1: '이미지 렌더링 중...' });
            const cleanBase64 = image.data.replace(
              /^data:image\/\w+;base64,/,
              '',
            );
            editor?.setImage(`data:image/jpeg;base64,${cleanBase64}`);

            setTimeout(() => {
              editor?.focus('end');
              isSavingRef.current = false;
              performSave();
            }, 500);
          } else {
            isSavingRef.current = false;
          }
        } else {
          isPickingMediaRef.current = false;
          Toast.show({ type: 'info', text1: '클립보드에 이미지가 없습니다.' });
        }
      } catch (error) {
        isPickingMediaRef.current = false;
        isSavingRef.current = false;
        Toast.show({
          type: 'error',
          text1: '이미지를 붙여넣는 중 오류가 발생했습니다.',
        });
      }
    }, 300);
  };

  const handleAttachFile = () => {
    setMenuVisible(false);
    if (currentMemoState?.isLocked) {
      Toast.show({ type: 'error', text1: '잠긴 메모는 수정할 수 없습니다.' });
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    isPickingMediaRef.current = true;

    setTimeout(async () => {
      if (isPickingFile.current) return;
      try {
        isPickingFile.current = true;
        const result = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
        });
        isPickingMediaRef.current = false;

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

  const handleOpenFile = async (fileUri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) await Sharing.shareAsync(fileUri);
      else Toast.show({ type: 'error', text1: '파일을 열 수 없습니다.' });
    } catch (error) {
      console.log('파일 열기 에러:', error);
    }
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
    Keyboard.dismiss();
    editor?.blur();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await performSave();
    router.back();
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

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
          {currentMemoState?.isLocked ? (
            <LockIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          ) : (
            <>
              <AppTouchableOpacity
                disabled={!editorState.canUndo}
                onPress={() => editor?.undo()}
                style={{ opacity: editorState.canUndo ? 1 : 0.1 }}
              >
                <UndoIcon
                  width={28}
                  height={28}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              </AppTouchableOpacity>
              <AppTouchableOpacity
                disabled={!editorState.canRedo}
                onPress={() => editor?.redo()}
                style={{ opacity: editorState.canRedo ? 1 : 0.1 }}
              >
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
                <AppTouchableOpacity
                  onPress={() => handleOpenFile(file.uri)}
                  style={{ flexShrink: 1 }}
                >
                  <AppText
                    style={[styles.fileName, isDark && styles.darkFileName]}
                    numberOfLines={1}
                  >
                    📄 {file.name}
                  </AppText>
                </AppTouchableOpacity>
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
        <View
          style={[
            styles.footer,
            isDark && styles.darkFooter,
            {
              height: 50 + (isKeyboardVisible ? 0 : insets.bottom),
              paddingBottom: isKeyboardVisible ? 0 : insets.bottom,
            },
          ]}
        >
          <View>
            <AppTouchableOpacity
              onPress={async () => {
                await performSave();
                router.replace('/memo-editor');
              }}
            >
              <AddMemoIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>
          </View>
        </View>
      )}

      {/* 💡 분리된 옵션 메뉴 컴포넌트 마운트 */}
      <MemoOptionMenu
        visible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        isDark={isDark}
        isFocused={editorState.isFocused}
        isPinned={!!currentMemoState?.isPinned}
        isLocked={!!currentMemoState?.isLocked}
        onAttachImage={handleAttachImage}
        onPasteImage={handlePasteImage}
        onAttachFile={handleAttachFile}
        onTogglePin={() => {
          updateMemo(currentIdRef.current, {
            isPinned: !currentMemoState?.isPinned,
          });
          setMenuVisible(false);
        }}
        onToggleLock={() => {
          updateMemo(currentIdRef.current, {
            isLocked: !currentMemoState?.isLocked,
          });
          setMenuVisible(false);
        }}
        onExportPdf={handleExportPdf}
        onDelete={() => {
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
      />

      {/* 💡 PDF 생성 중 스피너 오버레이 */}
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 50,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FCFBFA',
  },
  darkFooter: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#111111',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
