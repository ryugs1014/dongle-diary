import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface MemoFile {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface MemoEntry {
  id: string;
  title: string;
  content: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean; // 📌 고정 여부
  isLocked?: boolean; // 🔒 잠금 여부
  folderId?: string | null; // 📁 속한 폴더 ID
  deletedAt?: number; // 🔥 휴지통 기능: 삭제된 타임스탬프 (이 값이 있으면 휴지통에 있는 것)
  files?: MemoFile[];
}

// 상단 타입 정의 부분에 추가
export interface FolderEntry {
  id: string;
  name: string;
  isPinned?: boolean;
  createdAt: number;
}

export type MemoScreenType = 'folder' | 'list';
export type MemoStartupType = 'folder' | 'list' | 'last_visited';

interface MemoStore {
  memos: MemoEntry[];
  addMemo: (
    memo: Omit<MemoEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => void;
  updateMemo: (id: string, updated: Partial<MemoEntry>) => void;
  deleteMemo: (id: string) => void; // 영구 삭제

  folders: FolderEntry[];
  addFolder: (name: string) => void;
  updateFolder: (id: string, updated: Partial<FolderEntry>) => void;
  deleteFolder: (id: string) => void;

  // 🟢 새로 추가된 액션들
  duplicateMemo: (id: string) => void;
  deleteMultipleMemos: (ids: string[]) => void; // 다중 영구 삭제
  moveMultipleMemos: (ids: string[], folderId: string | null) => void;

  // 🔥 휴지통 관련 액션들
  moveToTrash: (id: string) => void;
  moveMultipleToTrash: (ids: string[]) => void;
  restoreMemo: (id: string) => void;
  restoreMultipleMemos: (ids: string[]) => void;
  cleanupTrash: () => void; // 30일 지난 메모 자동 삭제

  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  reorderFolders: (newFolders: FolderEntry[]) => void;

  autoDeleteDays: number;
  setAutoDeleteDays: (days: number) => void;

  lastVisitedMemoScreen: MemoScreenType;
  setLastVisitedMemoScreen: (screen: MemoScreenType) => void;
  memoStartupScreen: MemoStartupType;
  setMemoStartupScreen: (screen: MemoStartupType) => void;

  // 💡 구글 드라이브 백업용 상태
  googleToken: string | null;
  googleEmail: string | null;
  lastBackupDate: string | null;
  setGoogleAuth: (token: string | null, email: string | null) => void;
  setLastBackupDate: (date: string | null) => void;
  restoreMemoData: (memos: MemoEntry[], folders: FolderEntry[]) => void;

  clearAllMemos: () => void; // 메모장 초기화
  resetMemoSettings: () => void; // 🔥 메모 설정 초기화 함수 추가
}

// 💡 [핵심] 영구 삭제 시 실제 기기 용량을 비워주는 안전한 파일 삭제 함수
const deleteMemoFiles = async (
  memosToDelete: MemoEntry[],
  allMemos: MemoEntry[],
) => {
  try {
    const urisToDelete = new Set<string>();

    // 1. 삭제할 메모들에서 파일 경로 추출 (본문 이미지 + 첨부파일)
    memosToDelete.forEach((memo) => {
      const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
      let match;
      while ((match = regex.exec(memo.content)) !== null) {
        urisToDelete.add(match[1]);
      }
      if (memo.files) {
        memo.files.forEach((f) => {
          if (f.uri.startsWith('file://')) urisToDelete.add(f.uri);
        });
      }
    });

    if (urisToDelete.size === 0) return;

    // 2. 삭제되지 않고 "남아있는" 나머지 메모들의 파일 경로 추출 (교집합 방지)
    const remainingMemos = allMemos.filter(
      (m) => !memosToDelete.some((rm) => rm.id === m.id),
    );
    const urisToKeep = new Set<string>();

    remainingMemos.forEach((memo) => {
      const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
      let match;
      while ((match = regex.exec(memo.content)) !== null) {
        urisToKeep.add(match[1]);
      }
      if (memo.files) {
        memo.files.forEach((f) => {
          if (f.uri.startsWith('file://')) urisToKeep.add(f.uri);
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
            '🗑️ [완전 삭제] 더 이상 쓰이지 않는 이미지/파일 삭제됨:',
            uri,
          );
        }
      }
    }
  } catch (error) {
    console.log('로컬 파일 삭제 중 에러 발생:', error);
  }
};

export const useMemoStore = create<MemoStore>()(
  persist(
    (set, get) => ({
      memos: [],
      addMemo: (memo) =>
        set((state) => {
          const now = Date.now();
          return {
            memos: [
              { ...memo, id: now.toString(), createdAt: now, updatedAt: now },
              ...state.memos,
            ],
          };
        }),
      updateMemo: (id, updated) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            m.id === id ? { ...m, ...updated, updatedAt: Date.now() } : m,
          ),
        })),

      // 💡 진짜 영구 삭제 시 백그라운드에서 파일 삭제
      deleteMemo: (id) => {
        const state = get();
        const memoToDelete = state.memos.find((m) => m.id === id);

        // UI 즉시 반영을 위해 상태 먼저 업데이트
        set((state) => ({ memos: state.memos.filter((m) => m.id !== id) }));

        // 백그라운드에서 안전하게 파일 정리
        if (memoToDelete) {
          deleteMemoFiles([memoToDelete], state.memos).catch(console.error);
        }
      },

      // 💡 다중 영구 삭제 시 백그라운드에서 파일 삭제
      deleteMultipleMemos: (ids) => {
        const state = get();
        const memosToDelete = state.memos.filter((m) => ids.includes(m.id));

        set((state) => ({
          memos: state.memos.filter((m) => !ids.includes(m.id)),
        }));

        if (memosToDelete.length > 0) {
          deleteMemoFiles(memosToDelete, state.memos).catch(console.error);
        }
      },

      // 🔥 휴지통 이동 로직 (deletedAt 스탬프 찍기)
      moveToTrash: (id) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            m.id === id ? { ...m, deletedAt: Date.now(), isPinned: false } : m,
          ),
        })),
      moveMultipleToTrash: (ids) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            ids.includes(m.id)
              ? { ...m, deletedAt: Date.now(), isPinned: false }
              : m,
          ),
        })),

      // 🔥 휴지통에서 복구 (deletedAt 제거)
      restoreMemo: (id) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            m.id === id ? { ...m, deletedAt: undefined } : m,
          ),
        })),
      restoreMultipleMemos: (ids) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            ids.includes(m.id) ? { ...m, deletedAt: undefined } : m,
          ),
        })),

      autoDeleteDays: 30,
      setAutoDeleteDays: (days) => set({ autoDeleteDays: days }),

      // 💡 자동 삭제(30일 경과) 시 백그라운드에서 파일 삭제
      cleanupTrash: () => {
        const state = get();
        if (state.autoDeleteDays === 0) return;

        const now = Date.now();
        const DELETE_INTERVAL = state.autoDeleteDays * 24 * 60 * 60 * 1000;

        const memosToDelete = state.memos.filter(
          (m) => m.deletedAt && now - m.deletedAt >= DELETE_INTERVAL,
        );

        set((state) => ({
          memos: state.memos.filter(
            (m) => !m.deletedAt || now - m.deletedAt < DELETE_INTERVAL,
          ),
        }));

        if (memosToDelete.length > 0) {
          deleteMemoFiles(memosToDelete, state.memos).catch(console.error);
        }
      },

      folders: [],
      addFolder: (name) =>
        set((state) => ({
          folders: [
            { id: Date.now().toString(), name, createdAt: Date.now() },
            ...state.folders,
          ],
        })),
      updateFolder: (id, updated) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updated } : f,
          ),
        })),
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          memos: state.memos.map((m) =>
            m.folderId === id ? { ...m, folderId: null } : m,
          ),
        })),

      duplicateMemo: (id) =>
        set((state) => {
          const target = state.memos.find((m) => m.id === id);
          if (!target) return state;
          const now = Date.now();
          const duplicated = {
            ...target,
            id: now.toString(),
            title: `${target.title} (복제됨)`,
            createdAt: now,
            updatedAt: now,
          };
          return { memos: [duplicated, ...state.memos] };
        }),
      moveMultipleMemos: (ids, folderId) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            ids.includes(m.id) ? { ...m, folderId, updatedAt: Date.now() } : m,
          ),
        })),

      activeFolderId: null,
      setActiveFolderId: (id) => set({ activeFolderId: id }),
      reorderFolders: (newFolders) => set({ folders: newFolders }),

      lastVisitedMemoScreen: 'list',
      setLastVisitedMemoScreen: (screen) =>
        set({ lastVisitedMemoScreen: screen }),
      memoStartupScreen: 'list',
      setMemoStartupScreen: (screen) => set({ memoStartupScreen: screen }),

      // 💡 구글 드라이브 액션 초기화
      googleToken: null,
      googleEmail: null,
      lastBackupDate: null,
      setGoogleAuth: (token, email) =>
        set({ googleToken: token, googleEmail: email }),
      setLastBackupDate: (date) => set({ lastBackupDate: date }),
      restoreMemoData: (newMemos, newFolders) =>
        set({ memos: newMemos, folders: newFolders }),

      clearAllMemos: () => {
        const state = get();
        const allMemos = [...state.memos];

        set({ memos: [], folders: [], activeFolderId: null });

        if (allMemos.length > 0) {
          deleteMemoFiles(allMemos, []).catch(console.error);
        }
      },

      resetMemoSettings: () =>
        set({
          autoDeleteDays: 30, // 기본값 30일
          memoStartupScreen: 'list', // 기본값 리스트 뷰
          lastVisitedMemoScreen: 'list', // 방문 기록도 초기화
        }),
    }),
    {
      name: 'memo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
