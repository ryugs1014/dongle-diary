import { create } from 'zustand';
// 🌟 1. 영구 저장을 위한 persist, createJSONStorage 임포트
import { persist, createJSONStorage } from 'zustand/middleware';
// 🌟 2. AsyncStorage 임포트 (설치 안 하셨다면: npx expo install @react-native-async-storage/async-storage)
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

  setSelectedDate: (date: string) => void;
  setSelectedEmotions: (emotions: string[]) => void;

  addDiary: (diary: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
  updateDiary: (id: string, updated: Partial<DiaryEntry>) => void;
  deleteDiary: (id: string) => void;

  saveDraft: (draft: DraftEntry) => void;
  clearDraft: () => void;

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

// 🌟 3. create<DiaryStore>()( persist( ... ) ) 형태로 래핑합니다.
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

      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedEmotions: (emotions) => set({ selectedEmotions: emotions }),

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
    }),
    {
      name: 'diary-storage', // 기기에 저장될 스토리지 키 이름
      storage: createJSONStorage(() => AsyncStorage, {
        // 🌟 4. Date 객체가 문자열로 저장되었다가 불러올 때 다시 Date 객체로 복원되도록 처리
        reviver: (key, value) => {
          if (key === 'alarmTime' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
    },
  ),
);
