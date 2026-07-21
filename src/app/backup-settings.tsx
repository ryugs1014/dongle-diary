import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppConfirmModal from '@/components/AppConfirmModal';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useDiaryStore } from '../store/useDiaryStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

WebBrowser.maybeCompleteAuthSession();

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

  const [isLoading, setIsLoading] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      webClientId:
        '434139943-o0glst1t2lk89bgokhcpg3r5ags0eqgp.apps.googleusercontent.com',
      iosClientId:
        '434139943-ushi0r2tj7bg1vaqern9o3ou7akouvq5.apps.googleusercontent.com',
    });

    if (googleToken) {
      verifyAndLoadGoogleData(googleToken);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      // 구글 로그인 창 표시
      await GoogleSignin.signIn();
      // 성공 시 토큰 가져오기
      const tokens = await GoogleSignin.getTokens();

      if (tokens.accessToken) {
        verifyAndLoadGoogleData(tokens.accessToken);
      }
    } catch (error: any) {
      console.log('Google Native Login Error:', error);
      Alert.alert('로그인 실패', '구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndLoadGoogleData = async (token: string) => {
    setIsLoading(true);
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
    } catch (error) {
      console.log('Google Auth Error:', error);
      setGoogleAuth(null, null);
    } finally {
      setIsLoading(false);
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

  const handleBackupPress = () => {
    if (!googleToken) {
      return Alert.alert('알림', '먼저 구글 계정으로 연결해주세요.');
    }
    setBackupModalVisible(true);
  };

  const executeBackup = async () => {
    setBackupModalVisible(false);
    setIsLoading(true);

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
      const fileId = await findBackupFileId(googleToken);

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
      Alert.alert(
        '백업 완료',
        '사진을 포함한 모든 일기가 안전하게 백업되었습니다.',
      );
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '백업 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePress = () => {
    if (!googleToken) {
      return Alert.alert('알림', '먼저 구글 계정으로 연결해주세요.');
    }
    setRestoreModalVisible(true);
  };

  const executeRestore = async () => {
    setRestoreModalVisible(false);
    setIsLoading(true);

    try {
      const fileId = await findBackupFileId(googleToken!);
      if (!fileId) {
        Alert.alert('알림', '구글 드라이브에 백업된 데이터가 없습니다.');
        setIsLoading(false);
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
        Alert.alert('복구 완료', '성공적으로 데이터를 복구했습니다!');
      } else {
        throw new Error('데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '데이터를 복구하는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.darkContainer]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{ headerTitle: '구글 드라이브 백업', headerBackTitle: '설정' }}
      />

      <View style={styles.content}>
        <Ionicons
          name="cloud-done"
          size={80}
          color="#FF6F61"
          style={styles.icon}
        />
        <AppText style={[styles.title, isDark && styles.darkText]}>
          클라우드 백업 및 복구
        </AppText>
        <AppText style={[styles.desc, isDark && styles.darkSubText]}>
          소중한 일기를 구글 드라이브에 안전하게 보관하세요.{'\n'}
          기기를 변경하거나 앱을 다시 설치해도 데이터를 복구할 수 있습니다.
        </AppText>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#FF6F61"
            style={{ marginTop: 20 }}
          />
        ) : !googleToken ? (
          <AppTouchableOpacity
            style={[styles.btn, styles.googleBtn]}
            onPress={handleGoogleLogin}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <AppText style={styles.btnText}>구글 계정으로 연결하기</AppText>
          </AppTouchableOpacity>
        ) : (
          <View style={styles.actionContainer}>
            <View style={[styles.accountBox, isDark && styles.darkAccountBox]}>
              <View style={styles.accountHeader}>
                <Ionicons
                  name="person-circle"
                  size={40}
                  color={isDark ? '#ccc' : '#555'}
                />
                <View style={{ marginLeft: 10 }}>
                  <AppText
                    style={[styles.accountLabel, isDark && styles.darkSubText]}
                  >
                    연결된 계정
                  </AppText>
                  <AppText
                    style={[styles.accountEmail, isDark && styles.darkText]}
                  >
                    {googleEmail}
                  </AppText>
                </View>
              </View>
              <View style={styles.divider} />
              <AppText
                style={[styles.backupDateText, isDark && styles.darkSubText]}
              >
                최근 백업: {lastBackupDate ? lastBackupDate : '백업 기록 없음'}
              </AppText>
            </View>

            <AppTouchableOpacity
              style={[styles.btn, styles.backupBtn]}
              onPress={handleBackupPress}
            >
              <AppText style={styles.btnText}>지금 백업하기</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.btn, styles.restoreBtn]}
              onPress={handleRestorePress}
            >
              <AppText
                style={[styles.restoreBtnText, isDark && styles.darkText]}
              >
                데이터 복구하기
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.changeAccountBtn}
              onPress={async () => {
                await GoogleSignin.signOut();
                setGoogleAuth(null, null);
                setLastBackupDate(null);
              }}
            >
              <AppText style={styles.changeAccountText}>계정 변경하기</AppText>
            </AppTouchableOpacity>
          </View>
        )}
      </View>

      <AppConfirmModal
        visible={backupModalVisible}
        title="데이터 백업"
        message={
          '현재 기기의 모든 일기를\n구글 드라이브에 백업하시겠습니까?\n\n* 드라이브에 저장된 백업 데이터를 덮어씁니다.'
        }
        confirmText="백업"
        confirmColor="#007AFF"
        onCancel={() => setBackupModalVisible(false)}
        onConfirm={executeBackup}
      />

      <AppConfirmModal
        visible={restoreModalVisible}
        title="데이터 복구"
        message={
          '구글 드라이브에 저장된 데이터로\n복구를 진행하시겠습니까?\n\n* 기존에 작성한 일기를 덮어씁니다.'
        }
        confirmText="복구"
        confirmColor="#FF6F61"
        onCancel={() => setRestoreModalVisible(false)}
        onConfirm={executeRestore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#121212' },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  icon: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  darkText: { color: '#fff' },
  desc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  darkSubText: { color: '#aaa' },

  actionContainer: { width: '100%', alignItems: 'center' },

  accountBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  darkAccountBox: { backgroundColor: '#1e1e1e' },
  accountHeader: { flexDirection: 'row', alignItems: 'center' },
  accountLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  accountEmail: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  backupDateText: { fontSize: 14, color: '#555' },

  btn: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  googleBtn: { backgroundColor: '#4285F4' },
  backupBtn: { backgroundColor: '#FF6F61' },
  restoreBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  restoreBtnText: { color: '#555', fontSize: 16, fontWeight: 'bold' },

  changeAccountBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  changeAccountText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
