import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  deleteMemo: (id: string) => void;

  folders: FolderEntry[];
  addFolder: (name: string) => void;
  updateFolder: (id: string, updated: Partial<FolderEntry>) => void;
  deleteFolder: (id: string) => void;

  // 🟢 새로 추가된 액션들
  duplicateMemo: (id: string) => void;
  deleteMultipleMemos: (ids: string[]) => void;
  moveMultipleMemos: (ids: string[], folderId: string | null) => void;

  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
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
      deleteMemo: (id) =>
        set((state) => ({ memos: state.memos.filter((m) => m.id !== id) })),

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
          // 폴더 삭제
          folders: state.folders.filter((f) => f.id !== id),
          // 해당 폴더에 속해있던 메모들을 기본(null) 상태로 되돌림
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
      deleteMultipleMemos: (ids) =>
        set((state) => ({
          memos: state.memos.filter((m) => !ids.includes(m.id)),
        })),
      moveMultipleMemos: (ids, folderId) =>
        set((state) => ({
          memos: state.memos.map((m) =>
            ids.includes(m.id) ? { ...m, folderId, updatedAt: Date.now() } : m,
          ),
        })),

      activeFolderId: null,
      setActiveFolderId: (id) => set({ activeFolderId: id }),
    }),
    {
      name: 'memo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
