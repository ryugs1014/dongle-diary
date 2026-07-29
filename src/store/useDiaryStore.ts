import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy'; // 💡 파일 시스템 추가

export type DiaryBlock = {
  id: string;
  type: 'text' | 'image';
  value: string;
};

export interface DiaryEntry {
  id: string;
  date: string;
  emotion?: string;
  emotions: string[];
  title?: string;
  content: string;
  blocks?: DiaryBlock[];
  timestamp: number;
}

export interface DraftEntry {
  date: string;
  emotions: string[];
  title: string;
  content: string;
  // blocks: DiaryBlock[];
}

export type AppLanguage = 'system' | 'ko' | 'en';
export type AppTheme = 'system' | 'light' | 'dark';

export type AppScreen = 'diary' | 'memo';
export type StartupScreen = 'diary' | 'memo' | 'last_visited';

interface DiaryStore {
  diaries: DiaryEntry[];
  selectedDate: string;
  selectedEmotions: string[];
  draft: DraftEntry | null;

  isLockEnabled: boolean;
  pinCode: string | null;
  isBiometricEnabled: boolean;

  language: AppLanguage;
  theme: AppTheme;
  googleToken: string | null;
  googleEmail: string | null;
  lastBackupDate: string | null;
  isAlarmEnabled: boolean;
  alarmTime: Date;
  diaryFontSize: number;
  diaryFontFamily: string;
  calendarStartMonday: boolean;
  alwaysShowDate: boolean;

  addDiary: (diary: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
  updateDiary: (id: string, updated: Partial<DiaryEntry>) => void;
  deleteDiary: (id: string) => void; // 💡 여기서 실제 파일도 지우게 됨

  saveDraft: (draft: DraftEntry) => void;
  clearDraft: () => void;
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;

  isSystemAction: boolean;
  setIsSystemAction: (value: boolean) => void;

  setSelectedDate: (date: string) => void;
  setSelectedEmotions: (emotions: string[]) => void;
  setLockEnabled: (enabled: boolean) => void;
  setPinCode: (pin: string | null) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setLanguage: (lang: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  restoreDiaries: (diaries: DiaryEntry[]) => void;
  setGoogleAuth: (token: string | null, email: string | null) => void;
  setLastBackupDate: (date: string | null) => void;
  setAlarmEnabled: (enabled: boolean) => void;
  setAlarmTime: (time: Date) => void;
  setDiaryFontSize: (level: number) => void;
  setDiaryFontFamily: (font: string) => void;

  setCalendarStartMonday: (enabled: boolean) => void;
  setAlwaysShowDate: (enabled: boolean) => void;

  lastVisitedScreen: AppScreen;
  setLastVisitedScreen: (screen: AppScreen) => void;
  startupScreen: StartupScreen;
  setStartupScreen: (screen: StartupScreen) => void;
}

const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = getLocalToday();
const defaultAlarmTime = new Date();
defaultAlarmTime.setHours(22, 0, 0, 0);

// 💡 [핵심] 일기 삭제 시 실제 기기 용량을 비워주는 파일 삭제 함수
const deleteDiaryFiles = async (
  diariesToDelete: DiaryEntry[],
  allDiaries: DiaryEntry[],
) => {
  try {
    const urisToDelete = new Set<string>();

    // 1. 삭제할 일기에서 파일 경로 추출 (HTML content 안의 이미지 및 구버전 blocks)
    diariesToDelete.forEach((diary) => {
      if (diary.content) {
        const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
        let match;
        while ((match = regex.exec(diary.content)) !== null) {
          urisToDelete.add(match[1]);
        }
      }

      // 구버전(blocks) 일기 데이터 하위 호환성 유지
      if (diary.blocks) {
        diary.blocks.forEach((block) => {
          if (block.type === 'image' && block.value.startsWith('file://')) {
            urisToDelete.add(block.value);
          }
        });
      }
    });

    if (urisToDelete.size === 0) return;

    // 2. 남은 일기들에서 파일 경로 추출 (교집합으로 인한 오작동 방어)
    const remainingDiaries = allDiaries.filter(
      (d) => !diariesToDelete.some((rd) => rd.id === d.id),
    );
    const urisToKeep = new Set<string>();

    remainingDiaries.forEach((diary) => {
      if (diary.content) {
        const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
        let match;
        while ((match = regex.exec(diary.content)) !== null) {
          urisToKeep.add(match[1]);
        }
      }
      if (diary.blocks) {
        diary.blocks.forEach((block) => {
          if (block.type === 'image' && block.value.startsWith('file://')) {
            urisToKeep.add(block.value);
          }
        });
      }
    });

    // 3. 사용 중이지 않은 파일만 실제 기기에서 삭제 처리
    for (const uri of urisToDelete) {
      if (!urisToKeep.has(uri)) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
          console.log(
            '🗑️ [완전 삭제] 더 이상 쓰이지 않는 일기 이미지 삭제됨:',
            uri,
          );
        }
      }
    }
  } catch (error) {
    console.log('로컬 일기 파일 삭제 중 에러 발생:', error);
  }
};

export const useDiaryStore = create<DiaryStore>()(
  persist(
    // 💡 get()을 사용하기 위해 set 옆에 get 추가
    (set, get) => ({
      diaries: [],
      selectedDate: today,
      selectedEmotions: [],
      draft: null,

      isLockEnabled: false,
      pinCode: null,
      isBiometricEnabled: false,
      language: 'system',
      theme: 'light',
      googleToken: null,
      googleEmail: null,
      lastBackupDate: null,
      isAlarmEnabled: false,
      alarmTime: defaultAlarmTime,
      diaryFontSize: 3,
      diaryFontFamily: 'NanumSquareRound',
      calendarStartMonday: false,
      alwaysShowDate: false,

      addDiary: (diary) =>
        set((state) => ({
          diaries: [
            ...state.diaries,
            { ...diary, id: Date.now().toString(), timestamp: Date.now() },
          ],
        })),
      updateDiary: (id, updated) =>
        set((state) => ({
          diaries: state.diaries.map((d) =>
            d.id === id ? { ...d, ...updated } : d,
          ),
        })),

      // 💡 진짜 영구 삭제 시 백그라운드에서 파일 삭제
      deleteDiary: (id) => {
        const state = get();
        const diaryToDelete = state.diaries.find((d) => d.id === id);

        // UI 즉시 반영을 위해 상태 먼저 업데이트
        set((state) => ({
          diaries: state.diaries.filter((d) => d.id !== id),
        }));

        // 백그라운드에서 안전하게 파일 정리
        if (diaryToDelete) {
          deleteDiaryFiles([diaryToDelete], state.diaries).catch(console.error);
        }
      },

      saveDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
      isAppReady: false,
      setAppReady: (ready) => set({ isAppReady: ready }),

      isSystemAction: false,
      setIsSystemAction: (value) => set({ isSystemAction: value }),

      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedEmotions: (emotions) => set({ selectedEmotions: emotions }),
      setLockEnabled: (enabled) => set({ isLockEnabled: enabled }),
      setPinCode: (pin) => set({ pinCode: pin }),
      setBiometricEnabled: (enabled) => set({ isBiometricEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      restoreDiaries: (newDiaries) => set({ diaries: newDiaries }),
      setGoogleAuth: (token, email) =>
        set({ googleToken: token, googleEmail: email }),
      setLastBackupDate: (date) => set({ lastBackupDate: date }),
      setAlarmEnabled: (enabled) => set({ isAlarmEnabled: enabled }),
      setAlarmTime: (time) => set({ alarmTime: time }),
      setDiaryFontSize: (level) => set({ diaryFontSize: level }),
      setDiaryFontFamily: (font) => set({ diaryFontFamily: font }),
      setCalendarStartMonday: (enabled) =>
        set({ calendarStartMonday: enabled }),
      setAlwaysShowDate: (enabled) => set({ alwaysShowDate: enabled }),

      lastVisitedScreen: 'diary',
      setLastVisitedScreen: (screen) => set({ lastVisitedScreen: screen }),
      startupScreen: 'diary',
      setStartupScreen: (screen) => set({ startupScreen: screen }),
    }),
    {
      name: 'diary-storage',
      storage: createJSONStorage(() => AsyncStorage, {
        reviver: (key, value) => {
          if (key === 'alarmTime' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
      partialize: (state) => {
        const { selectedDate, isAppReady, ...rest } = state;
        return rest;
      },
    },
  ),
);
