import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
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
import * as WebBrowser from 'expo-web-browser';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDiaryStore } from '../store/useDiaryStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { BackIcon, CloudIcon, DownloadIcon, UploadIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import Toast from 'react-native-toast-message';
import CustomSpinner from '@/components/common/CustomSpinner';

WebBrowser.maybeCompleteAuthSession();

const INFO_LIST = [
  {
    title: '데이터 덮어쓰기 주의',
    desc: [
      '백업을 진행하면 기존 구글 드라이브에 있던 백업 데이터가 현재 기기의 데이터로 완전히 덮어씌워집니다.',
    ],
  },
  {
    title: '복원 시 데이터 유실',
    desc: [
      '복원을 진행하면 현재 기기에 작성된 최신 일기들이 구글 드라이브의 과거 데이터로 대체됩니다.',
      '복원 전 반드시 확인해주세요.',
    ],
  },
  {
    title: '사진 및 이미지 데이터',
    desc: [
      '일기에 첨부된 사진들도 함께 안전하게 백업됩니다.',
      '일기 양에 따라 다소 시간이 소요될 수 있습니다.',
    ],
  },
];

type LoadingType = 'auth' | 'backup' | 'restore' | null;

export default function BackupSettingsScreen() {
  const {
    diaries,
    restoreDiaries,
    theme,
    googleToken,
    googleEmail,
    lastBackupDate,
    setGoogleAuth,
    setLastBackupDate,
  } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // 로딩 상태를 작업별로 세분화
  const [loadingType, setLoadingType] = useState<LoadingType>(null);

  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  // 플로팅 버튼 애니메이션 값 (초기화면 밑으로 150px 숨김)
  const slideAnim = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      webClientId:
        '434139943-o0glst1t2lk89bgokhcpg3r5ags0eqgp.apps.googleusercontent.com',
      iosClientId:
        '434139943-ushi0r2tj7bg1vaqern9o3ou7akouvq5.apps.googleusercontent.com',
    });

    // if (googleToken) {
    //   verifyAndLoadGoogleData(googleToken);
    // }

    restoreGoogleSession();
  }, []);

  const restoreGoogleSession = async () => {
    try {
      // 1. 기기(네이티브)에 구글 로그인 세션이 남아있는지 확인합니다.
      const isSignedIn = await GoogleSignin.hasPreviousSignIn();

      if (isSignedIn) {
        setLoadingType('auth');
        // 2. 세션이 있다면 조용히 로그인을 시도합니다. (토큰이 만료되었다면 알아서 새 토큰으로 갱신해 줍니다!)
        await GoogleSignin.signInSilently();
        const tokens = await GoogleSignin.getTokens();

        if (tokens.accessToken) {
          await verifyAndLoadGoogleData(tokens.accessToken);
        }
      } else if (googleToken) {
        // 기기 세션은 없지만 Zustand에 예전 토큰이 남아있는 경우 방어 코드
        await verifyAndLoadGoogleData(googleToken);
      }
    } catch (error) {
      console.log('Silent Sign In Error:', error);
      // 토큰 갱신에 완전히 실패했을 때만 상태를 초기화합니다.
      setGoogleAuth(null, null);
      setLoadingType(null);
    }
  };

  // 구글 로그인 상태에 따라 플로팅 버튼 애니메이션 작동
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: googleToken ? 0 : 150, // 로그인시 0으로 올라옴, 로그아웃시 밑으로 숨음
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [googleToken]);

  const handleGoogleLogin = async () => {
    setLoadingType('auth');
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

      setLoadingType(null); // 실패 시에만 여기서 초기화 (성공 시 verify에서 초기화)
    }
  };

  const verifyAndLoadGoogleData = async (token: string) => {
    setLoadingType('auth');
    try {
      const userRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!userRes.ok) throw new Error('Token Expired');
      const userData = await userRes.json();
      setGoogleAuth(token, userData.email);

      const fileRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='diary_backup.json'&fields=files(id, modifiedTime)",
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

      // 진짜로 토큰이 만료되었거나 인증 에러일 때만 로그아웃 처리
      if (error.message === 'Token Expired' || error.message.includes('401')) {
        setGoogleAuth(null, null);
      }
      // 단순 네트워크 에러일 때는 로그아웃 시키지 않고 넘어감
    } finally {
      setLoadingType(null);
    }
  };

  const findBackupFileId = async (token: string) => {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='diary_backup.json'&fields=files(id)",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  };

  const executeBackup = async () => {
    setBackupModalVisible(false);
    setLoadingType('backup');

    try {
      const backupDiaries = JSON.parse(JSON.stringify(diaries));

      for (let diary of backupDiaries) {
        if (diary.blocks && Array.isArray(diary.blocks)) {
          for (let block of diary.blocks) {
            if (block.type === 'image' && block.value.startsWith('file://')) {
              try {
                const manipResult = await ImageManipulator.manipulateAsync(
                  block.value,
                  [{ resize: { width: 1080 } }],
                  {
                    compress: 0.8,
                    format: ImageManipulator.SaveFormat.JPEG,
                    base64: true,
                  },
                );

                if (manipResult.base64) {
                  block.value = `data:image/jpeg;base64,${manipResult.base64}`;
                }
              } catch (imgError) {
                console.log('이미지 백업 준비 실패:', imgError);
              }
            }
          }
        }
      }

      const fileContent = JSON.stringify(backupDiaries);
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
              name: 'diary_backup.json',
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
        text1: '모든 일기가 안전하게 백업되었어요',
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
          text1: '구글 드라이브에 백업된 데이터가 없어요',
          position: 'top',
          topOffset: 60,
        });
        setLoadingType(null);
        return;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${googleToken}` },
        },
      );

      const downloadedData = await res.json();

      if (Array.isArray(downloadedData)) {
        const migratedData = downloadedData.map((d) => ({
          ...d,
          emotions: d.emotions || (d.emotion ? [d.emotion] : []),
          blocks: d.blocks || [],
        }));

        restoreDiaries(migratedData);
        Toast.show({
          type: 'success',
          text1: '데이터가 복원되었어요',
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

    // 상태 변경 후 바로 다시 로그인 시작
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
            구글 드라이브 백업 · 복원
          </AppText>
          <AppText style={[styles.mainDesc, isDark && styles.darkSubText]}>
            소중하게 작성한 일기를 안전하게 보관하세요.{'\n'}
            기기를 바꿔도 불러올 수 있어요.
          </AppText>
          <AppText style={[styles.mainDesc, isDark && styles.darkSubText]}>
            * iOS (아이폰 · 아이패드), 안드로이드 간 공유 가능
          </AppText>
        </View>

        {/* 계정 연동 영역 */}
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
                      // 로딩 중일 때 계정 변경 버튼 비활성화 시각 효과
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
          <AppText style={[styles.infoMainTitle, isDark && styles.darkSubText]}>
            읽어주세요
          </AppText>
          {INFO_LIST.map((info, index) => (
            <View key={index} style={styles.infoItem}>
              {/* 제목은 위로 분리 */}
              <AppText style={[styles.infoTitle, isDark && styles.darkText]}>
                {info.title}
              </AppText>

              {/* 설명을 배열로 돌면서 각각 불릿 기호 적용 */}
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

      {/* 전체 화면 로딩 오버레이 */}
      {loadingType !== null && (
        <View style={styles.fullScreenOverlay}>
          <CustomSpinner />
        </View>
      )}

      <AppConfirmModal
        visible={backupModalVisible}
        title="데이터 백업"
        message={
          '현재 기기의 모든 일기를\n구글 드라이브에 백업하시겠습니까?\n\n* 드라이브의 기존 백업 데이터를 덮어씁니다.'
        }
        confirmText="백업"
        confirmColor="#FF6262"
        onCancel={() => setBackupModalVisible(false)}
        onConfirm={executeBackup}
      />

      <AppConfirmModal
        visible={restoreModalVisible}
        title="데이터 복원"
        message={
          '구글 드라이브에 저장된 데이터로\n복원을 진행하시겠습니까?\n\n* 현재 기기에 작성된 일기를 덮어씁니다.'
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
  infoMainTitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 25,
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
