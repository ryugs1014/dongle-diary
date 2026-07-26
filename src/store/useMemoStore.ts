import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export const useMemoStore = create<MemoStore>()(
  persist(
    (set) => ({
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

      // 진짜 영구 삭제 (휴지통 비우기 등에서 사용)
      deleteMemo: (id) =>
        set((state) => ({ memos: state.memos.filter((m) => m.id !== id) })),
      deleteMultipleMemos: (ids) =>
        set((state) => ({
          memos: state.memos.filter((m) => !ids.includes(m.id)),
        })),

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

      // 🔥 30일 경과한 휴지통 메모 자동 청소
      cleanupTrash: () =>
        set((state) => {
          const now = Date.now();
          const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
          return {
            memos: state.memos.filter(
              (m) => !m.deletedAt || now - m.deletedAt < THIRTY_DAYS,
            ),
          };
        }),

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
    }),
    {
      name: 'memo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
