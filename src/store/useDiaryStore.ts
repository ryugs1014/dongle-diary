import { create } from 'zustand';

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

export const useDiaryStore = create<DiaryStore>((set) => ({
  diaries: [],
  selectedDate: today,
  selectedEmotions: [],
  draft: null,

  isLockEnabled: false,
  pinCode: null,
  isBiometricEnabled: false,
  language: 'system',
  theme: 'system',
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
}));
