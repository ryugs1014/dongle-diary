import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  deleteDiary: (id: string) => void;

  saveDraft: (draft: DraftEntry) => void;
  clearDraft: () => void;
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;

  // 추가: 시스템 팝업(공유 창 등) 호출 여부 방어 플래그
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

export const useDiaryStore = create<DiaryStore>()(
  persist(
    (set) => ({
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
      deleteDiary: (id) =>
        set((state) => ({
          diaries: state.diaries.filter((d) => d.id !== id),
        })),

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
        // selectedDate는 저장 목록에서 빼고(앱 켤때마다 오늘 날짜로 초기화), 나머지만 저장합니다.
        const { selectedDate, isAppReady, ...rest } = state;
        return rest;
      },
    },
  ),
);
