import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Animated,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMemoStore } from '@/store/useMemoStore'; // 💡 메모 스토어 사용
import { useDiaryStore } from '@/store/useDiaryStore';
import {
  BackIcon,
  CloudIcon,
  DownloadIcon,
  UploadIcon,
  InfoIcon,
} from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import Toast from 'react-native-toast-message';
import CustomSpinner from '@/components/common/CustomSpinner';

const INFO_LIST = [
  {
    title: '메모 데이터 덮어쓰기 주의',
    desc: [
      '백업을 진행하면 기존 구글 드라이브에 있던 [메모장 백업 데이터]가 현재 기기의 메모와 폴더로 덮어씌워집니다.',
      '일기장 데이터에는 영향을 주지 않습니다.',
    ],
  },
  {
    title: '복원 시 데이터 유실',
    desc: [
      '복원을 진행하면 기기의 현재 메모와 폴더들이 구글 드라이브의 과거 메모 데이터로 완벽히 대체됩니다.',
    ],
  },
  {
    title: '사진 데이터 백업',
    desc: [
      '메모 내용에 포함된 사진 이미지들도 텍스트로 변환되어 함께 백업됩니다.',
      '이미지가 많을 경우 백업에 다소 시간이 소요될 수 있습니다.',
    ],
  },
];

type LoadingType = 'auth' | 'backup' | 'restore' | null;

export default function MemoBackupSettingsScreen() {
  const { theme, setIsSystemAction } = useDiaryStore();

  // 💡 메모 전용 상태 및 액션
  const {
    memos,
    folders,
    restoreMemoData,
    googleToken,
    googleEmail,
    lastBackupDate,
    setGoogleAuth,
    setLastBackupDate,
  } = useMemoStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [loadingType, setLoadingType] = useState<LoadingType>(null);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      webClientId:
        '434139943-o0glst1t2lk89bgokhcpg3r5ags0eqgp.apps.googleusercontent.com',
      iosClientId:
        '434139943-ushi0r2tj7bg1vaqern9o3ou7akouvq5.apps.googleusercontent.com',
    });

    restoreGoogleSession();
  }, []);

  const restoreGoogleSession = async () => {
    try {
      const isSignedIn = await GoogleSignin.hasPreviousSignIn();

      if (isSignedIn) {
        setLoadingType('auth');
        await GoogleSignin.signInSilently();
        const tokens = await GoogleSignin.getTokens();

        if (tokens.accessToken) {
          await verifyAndLoadGoogleData(tokens.accessToken);
        }
      } else if (googleToken) {
        await verifyAndLoadGoogleData(googleToken);
      }
    } catch (error) {
      console.log('Silent Sign In Error:', error);
      setGoogleAuth(null, null);
      setLoadingType(null);
    }
  };

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: googleToken ? 0 : 150,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [googleToken]);

  const handleGoogleLogin = async () => {
    setLoadingType('auth');
    setIsSystemAction(true);

    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (tokens.accessToken) {
        await verifyAndLoadGoogleData(tokens.accessToken);
      }

      Toast.show({
        type: 'success',
        text1: '계정이 연결되었어요',
        position: 'top',
        topOffset: 60,
      });
    } catch (error: any) {
      console.log('Google Native Login Error:', error);
      Toast.show({
        type: 'info',
        text1: '로그인이 중단되었어요',
        position: 'top',
        topOffset: 60,
      });
      setLoadingType(null);
    }
  };

  const verifyAndLoadGoogleData = async (token: string) => {
    setLoadingType('auth');
    try {
      const userRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!userRes.ok) throw new Error('Token Expired');
      const userData = await userRes.json();
      setGoogleAuth(token, userData.email);

      // 💡 메모 전용 백업 파일명: memo_backup.json
      const fileRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='memo_backup.json'&fields=files(id, modifiedTime)",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const fileData = await fileRes.json();

      if (fileData.files && fileData.files.length > 0) {
        const file = fileData.files[0];
        if (file.modifiedTime) {
          const dateObj = new Date(file.modifiedTime);
          setLastBackupDate(dateObj.toLocaleString('ko-KR'));
        }
      } else {
        setLastBackupDate(null);
      }
    } catch (error: any) {
      console.log('Google Auth Error:', error);
      if (error.message === 'Token Expired' || error.message.includes('401')) {
        setGoogleAuth(null, null);
      }
    } finally {
      setLoadingType(null);
    }
  };

  const findBackupFileId = async (token: string) => {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='memo_backup.json'&fields=files(id)",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  };

  const executeBackup = async () => {
    setBackupModalVisible(false);
    setLoadingType('backup');

    try {
      // 메모와 폴더 데이터 복사
      const backupMemos = JSON.parse(JSON.stringify(memos));
      const backupFolders = JSON.parse(JSON.stringify(folders));

      // 💡 기기에 저장된 메모 이미지를 Base64 텍스트로 변환하여 파일 안에 임베딩
      for (let memo of backupMemos) {
        if (memo.content && memo.content.includes('file://')) {
          const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
          let match;
          let newContent = memo.content;

          while ((match = regex.exec(memo.content)) !== null) {
            const fileUri = match[1];
            try {
              const fileInfo = await FileSystem.getInfoAsync(fileUri);
              if (fileInfo.exists) {
                const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                const ext = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;
                const base64Src = `data:image/${mimeType};base64,${base64Data}`;

                newContent = newContent.replace(fileUri, base64Src);
              }
            } catch (imgError) {
              console.log('메모 이미지 변환 실패:', imgError);
            }
          }
          memo.content = newContent;
        }
      }

      const backupData = {
        memos: backupMemos,
        folders: backupFolders,
      };

      const fileContent = JSON.stringify(backupData);
      const fileId = await findBackupFileId(googleToken!);

      if (fileId) {
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${googleToken}`,
              'Content-Type': 'application/json',
            },
            body: fileContent,
          },
        );
      } else {
        const metaRes = await fetch(
          'https://www.googleapis.com/drive/v3/files',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${googleToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'memo_backup.json', // 💡 일기와 완전히 독립된 파일명
              parents: ['appDataFolder'],
            }),
          },
        );
        const metaData = await metaRes.json();

        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${metaData.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${googleToken}`,
              'Content-Type': 'application/json',
            },
            body: fileContent,
          },
        );
      }

      setLastBackupDate(new Date().toLocaleString('ko-KR'));
      Toast.show({
        type: 'success',
        text1: '메모장이 안전하게 백업되었어요',
        position: 'top',
        topOffset: 60,
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: '백업 중 문제가 발생했어요',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoadingType(null);
    }
  };

  const executeRestore = async () => {
    setRestoreModalVisible(false);
    setLoadingType('restore');

    try {
      const fileId = await findBackupFileId(googleToken!);
      if (!fileId) {
        Toast.show({
          type: 'info',
          text1: '구글 드라이브에 백업된 메모 데이터가 없어요',
          position: 'top',
          topOffset: 60,
        });
        setLoadingType(null);
        return;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${googleToken}` } },
      );

      const downloadedData = await res.json();

      if (downloadedData.memos && downloadedData.folders) {
        // 💡 복원 시 MemoEditorScreen의 processHtmlForLoad 로직이
        // HTML 내의 Base64를 감지해서 자동으로 기기 내 파일로 저장해줍니다.
        restoreMemoData(downloadedData.memos, downloadedData.folders);

        Toast.show({
          type: 'success',
          text1: '메모 데이터가 복원되었어요',
          position: 'top',
          topOffset: 60,
        });
      } else {
        throw new Error('데이터 형식이 올바르지 않아요');
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'warn',
        text1: '데이터 복원에 실패했어요',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoadingType(null);
    }
  };

  const handleChangeAccount = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('SignOut Error', error);
    }
    setGoogleAuth(null, null);
    setLastBackupDate(null);

    setTimeout(() => {
      handleGoogleLogin();
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
            disabled={loadingType !== null}
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
            드라이브 백업 · 복원
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <CloudIcon
            width={60}
            height={60}
            color={isDark ? '#ffffff' : '#111111'}
          />
          <AppText style={[styles.mainTitle, isDark && styles.darkText]}>
            메모장 백업 · 복원
          </AppText>
          <AppText style={[styles.mainDesc, isDark && styles.darkSubText]}>
            작성한 메모와 폴더를 안전하게 보관하세요.{'\n'}
            일기장과는 별도로 관리됩니다.
          </AppText>
        </View>

        <View style={styles.authSection}>
          {!googleToken ? (
            <AppTouchableOpacity
              style={[
                styles.btn,
                styles.googleBtn,
                isDark && styles.darkGoogleBtn,
              ]}
              onPress={handleGoogleLogin}
              disabled={loadingType !== null}
            >
              <Ionicons
                name="logo-google"
                size={16}
                color={isDark ? '#111111' : '#ffffff'}
              />
              <AppText style={[styles.btnText, isDark && styles.darkBtnTExt]}>
                구글 계정 연결하기
              </AppText>
            </AppTouchableOpacity>
          ) : (
            <View style={[styles.accountBox, isDark && styles.darkAccountBox]}>
              <View
                style={[
                  styles.accountHeader,
                  isDark && styles.darkAccountHeader,
                ]}
              >
                <View style={styles.accountInfo}>
                  <AppText
                    style={[styles.accountLabel, isDark && styles.darkSubText]}
                  >
                    연결 계정
                  </AppText>
                  <AppText
                    style={[styles.accountEmail, isDark && styles.darkText]}
                  >
                    {googleEmail}
                  </AppText>
                </View>
                <View style={styles.accountInfo}>
                  <AppText
                    style={[styles.accountLabel, isDark && styles.darkSubText]}
                  >
                    최근 백업
                  </AppText>
                  <AppText
                    style={[styles.accountEmail, isDark && styles.darkText]}
                  >
                    {lastBackupDate ? lastBackupDate : '기록 없음'}
                  </AppText>
                </View>
              </View>

              <View style={styles.accountFooter}>
                <AppTouchableOpacity
                  onPress={handleChangeAccount}
                  disabled={loadingType !== null}
                >
                  <AppText
                    style={[
                      styles.changeAccountText,
                      loadingType !== null && { opacity: 0.3 },
                    ]}
                  >
                    계정 변경하기
                  </AppText>
                </AppTouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <InfoIcon
              width={24}
              height={24}
              color={isDark ? '#ffffff' : '#888'}
            />
            <AppText
              style={[styles.infoMainTitle, isDark && styles.darkSubText]}
            >
              읽어주세요
            </AppText>
          </View>

          {INFO_LIST.map((info, index) => (
            <View key={index} style={styles.infoItem}>
              <AppText style={[styles.infoTitle, isDark && styles.darkText]}>
                {info.title}
              </AppText>
              {info.desc.map((descItem, descIndex) => (
                <View key={descIndex} style={styles.descRow}>
                  <AppText style={styles.infoBullet}>*</AppText>
                  <AppText
                    style={[styles.infoDesc, isDark && styles.darkSubText]}
                  >
                    {descItem}
                  </AppText>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.floatingContainer,
          isDark && styles.darkFloatingContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <AppTouchableOpacity
          style={[
            styles.floatingBtn,
            styles.backupBtn,
            isDark && styles.darkBackupBtn,
            (loadingType === 'restore' || loadingType === 'auth') && {
              opacity: 0.3,
            },
          ]}
          onPress={() => setBackupModalVisible(true)}
          disabled={loadingType !== null}
        >
          <UploadIcon
            width={24}
            height={24}
            color={isDark ? '#111111' : '#ffffff'}
          />
          <AppText
            style={[styles.backupBtnText, isDark && styles.darkBackupBtnText]}
          >
            백업
          </AppText>
        </AppTouchableOpacity>

        <AppTouchableOpacity
          style={[
            styles.floatingBtn,
            styles.restoreBtn,
            isDark && styles.darkRestoreBtn,
            (loadingType === 'backup' || loadingType === 'auth') && {
              opacity: 0.3,
            },
          ]}
          onPress={() => setRestoreModalVisible(true)}
          disabled={loadingType !== null}
        >
          <DownloadIcon
            width={24}
            height={24}
            color={isDark ? '#ffffff' : '#111111'}
          />
          <AppText style={[styles.restoreBtnText, isDark && styles.darkText]}>
            복원
          </AppText>
        </AppTouchableOpacity>
      </Animated.View>

      {loadingType !== null && (
        <View style={styles.fullScreenOverlay}>
          <CustomSpinner />
        </View>
      )}

      <AppConfirmModal
        visible={backupModalVisible}
        title="메모 백업"
        message={
          '현재 기기의 모든 메모와 폴더를\n구글 드라이브에 백업하시겠습니까?\n\n* 기존 메모 백업 데이터를 덮어씁니다.'
        }
        confirmText="백업"
        confirmColor="#FF6262"
        onCancel={() => setBackupModalVisible(false)}
        onConfirm={executeBackup}
      />

      <AppConfirmModal
        visible={restoreModalVisible}
        title="메모 복원"
        message={
          '구글 드라이브에 저장된 메모로\n복원을 진행하시겠습니까?\n\n* 현재 기기에 작성된 메모를 덮어씁니다.'
        }
        confirmText="복원"
        confirmColor="#FF6262"
        onCancel={() => setRestoreModalVisible(false)}
        onConfirm={executeRestore}
      />
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
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },

  scrollWrapper: { flex: 1 },
  scrollContent: {
    paddingBottom: 120, // 플로팅 버튼에 가려지지 않게 여유 공간
  },

  topSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 10,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mainDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },

  authSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  btn: {
    width: '100%',
    flexDirection: 'row',
    height: 54,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  googleBtn: { backgroundColor: '#111111' },
  darkGoogleBtn: { backgroundColor: '#ffffff' },
  btnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  darkBtnTExt: { color: '#111111', fontSize: 14, fontWeight: 'bold' },
  accountBox: { gap: 20 },
  accountHeader: {
    gap: 20,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#f1f2f3',
  },
  darkAccountHeader: {
    backgroundColor: '#191919',
  },
  accountInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountLabel: { fontSize: 13, color: '#888' },
  accountEmail: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupDateText: { fontSize: 13, color: '#555' },
  changeAccountText: {
    color: '#555',
    fontSize: 13,
    fontWeight: 'bold',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#555',
  },

  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 15 },

  infoSection: { paddingHorizontal: 20, paddingTop: 25 },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginBottom: 25,
  },
  infoMainTitle: {
    fontSize: 13,
    color: '#555',
  },
  infoItem: { marginBottom: 25 },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoBullet: {
    color: '#666',
    fontSize: 16,
    marginTop: 4,
    marginRight: 4,
  },
  infoDesc: {
    flex: 1, // 글자가 길어지면 줄바꿈 되도록
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },

  // Floating Bottom Button Container
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40, // SafeArea 고려
    backgroundColor: '#ffffff',
    gap: 16,
  },
  darkFloatingContainer: {
    backgroundColor: '#111111',
  },
  floatingBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  backupBtn: { backgroundColor: '#111111' },
  darkBackupBtn: { backgroundColor: '#ffffff' },
  restoreBtn: { backgroundColor: '#f0f0f0' },
  darkRestoreBtn: { backgroundColor: '#191919' },
  restoreBtnText: { color: '#333', fontSize: 14 },
  backupBtnText: { color: '#ffffff', fontSize: 14 },
  darkBackupBtnText: { color: '#111111' },

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
    zIndex: 999, // 가장 위에 표시
  },
});
