import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Todo = {
  id: string;
  text: string;
  isCompleted: boolean;
};

export type Category = {
  id: string;
  name: string;
};

// 🔥 루틴을 위한 반복 타입 및 구조 정의
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Routine = {
  id: string;
  text: string;
  categoryIds: string[]; // 중복 카테고리 허용
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // 무한 반복일 경우 null
  repeatType: RepeatType;
  repeatDaysOfWeek?: number[]; // 0(일) ~ 6(토)
  repeatDaysOfMonth?: number[]; // 1 ~ 31
  repeatDatesOfYear?: { month: number; day: number }[];
  isActive: boolean;
};

export type ChecklistData = {
  [dateStr: string]: {
    [categoryId: string]: Todo[];
  };
};

interface ChecklistState {
  categories: Category[];
  checklistData: ChecklistData;
  routines: Routine[]; // 루틴 데이터
  lastVisitedChecklistScreen: string;

  // 카테고리 관리
  setCategories: (categories: Category[]) => void;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  reorderCategory: (id: string, direction: 'up' | 'down') => void;

  // 루틴 관리
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updatedRoutine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  reorderRoutine: (id: string, direction: 'up' | 'down') => void;

  // 투두 관리
  addTodo: (date: string, categoryId: string, todo: Todo) => void;
  toggleTodo: (date: string, categoryId: string, todoId: string) => void;
  updateTodoText: (
    date: string,
    categoryId: string,
    todoId: string,
    text: string,
  ) => void;
  deleteTodo: (date: string, categoryId: string, todoId: string) => void;

  setLastVisitedChecklistScreen: (screen: string) => void;

  showDateText: boolean;
  setShowDateText: (show: boolean) => void;
  isWeekView: boolean;
  setIsWeekView: (isWeek: boolean) => void;

  clearAllChecklists: () => void; // 할 일 목록 초기화
  resetChecklistSettings: () => void;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set) => ({
      categories: [
        { id: 'cat1', name: '오늘의 루틴' },
        { id: 'cat2', name: '업무 및 학업' },
        { id: 'cat3', name: '개인 및 기타' },
      ],
      checklistData: {},
      routines: [],
      lastVisitedChecklistScreen: 'checklist',

      // --- 카테고리 액션 ---
      setCategories: (categories) => set({ categories }),
      addCategory: (name) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { id: Date.now().toString(), name },
          ],
        })),
      updateCategory: (id, name) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, name } : cat,
          ),
        })),
      deleteCategory: (id) =>
        set((state) => {
          if (state.categories.length <= 1) return state; // 최소 1개 유지 방어 로직
          return {
            categories: state.categories.filter((cat) => cat.id !== id),
          };
        }),
      reorderCategory: (id, direction) =>
        set((state) => {
          const index = state.categories.findIndex((cat) => cat.id === id);
          if (index < 0) return state;
          if (direction === 'up' && index === 0) return state;
          if (direction === 'down' && index === state.categories.length - 1)
            return state;

          const newCategories = [...state.categories];
          const swapIndex = direction === 'up' ? index - 1 : index + 1;
          [newCategories[index], newCategories[swapIndex]] = [
            newCategories[swapIndex],
            newCategories[index],
          ];
          return { categories: newCategories };
        }),

      // --- 루틴 액션 ---
      addRoutine: (routine) =>
        set((state) => ({ routines: [...state.routines, routine] })),
      updateRoutine: (id, updatedRoutine) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, ...updatedRoutine } : r,
          ),
        })),
      deleteRoutine: (id) =>
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
        })),
      reorderRoutine: (id, direction) =>
        set((state) => {
          const index = state.routines.findIndex((r) => r.id === id);
          if (index < 0) return state;
          if (direction === 'up' && index === 0) return state;
          if (direction === 'down' && index === state.routines.length - 1)
            return state;

          const newRoutines = [...state.routines];
          const swapIndex = direction === 'up' ? index - 1 : index + 1;
          [newRoutines[index], newRoutines[swapIndex]] = [
            newRoutines[swapIndex],
            newRoutines[index],
          ];
          return { routines: newRoutines };
        }),

      // --- 투두 액션 (기존과 동일) ---
      addTodo: (date, categoryId, todo) =>
        set((state) => {
          const dayData = state.checklistData[date] || {};
          const catData = dayData[categoryId] || [];
          return {
            checklistData: {
              ...state.checklistData,
              [date]: { ...dayData, [categoryId]: [...catData, todo] },
            },
          };
        }),
      toggleTodo: (date, categoryId, todoId) =>
        set((state) => {
          const dayData = state.checklistData[date] || {};
          const catData = dayData[categoryId] || [];
          const exists = catData.find((t) => t.id === todoId);

          let updatedCatData;
          if (exists) {
            updatedCatData = catData.map((t) =>
              t.id === todoId ? { ...t, isCompleted: !t.isCompleted } : t,
            );
          } else if (todoId.startsWith('routine-')) {
            // 가상 루틴 항목을 처음 체크할 때 실제 데이터로 저장
            const routineId = todoId.replace('routine-', '');
            const routine = state.routines.find((r) => r.id === routineId);
            if (routine) {
              updatedCatData = [
                ...catData,
                { id: todoId, text: routine.text, isCompleted: true },
              ];
            } else {
              updatedCatData = catData;
            }
          } else {
            updatedCatData = catData;
          }

          return {
            checklistData: {
              ...state.checklistData,
              [date]: { ...dayData, [categoryId]: updatedCatData },
            },
          };
        }),

      updateTodoText: (date, categoryId, todoId, text) =>
        set((state) => {
          const dayData = state.checklistData[date] || {};
          const catData = dayData[categoryId] || [];
          const exists = catData.find((t) => t.id === todoId);

          let updatedCatData;
          if (exists) {
            updatedCatData = catData.map((t) =>
              t.id === todoId ? { ...t, text } : t,
            );
          } else if (todoId.startsWith('routine-')) {
            // 가상 루틴 항목의 텍스트를 특정 날짜에서 수정할 때
            updatedCatData = [
              ...catData,
              { id: todoId, text, isCompleted: false },
            ];
          } else {
            updatedCatData = catData;
          }

          return {
            checklistData: {
              ...state.checklistData,
              [date]: { ...dayData, [categoryId]: updatedCatData },
            },
          };
        }),
      deleteTodo: (date, categoryId, todoId) =>
        set((state) => {
          const dayData = state.checklistData[date] || {};
          const catData = dayData[categoryId] || [];
          const filtered = catData.filter((t) => t.id !== todoId);
          return {
            checklistData: {
              ...state.checklistData,
              [date]: { ...dayData, [categoryId]: filtered },
            },
          };
        }),

      setLastVisitedChecklistScreen: (screen) =>
        set({ lastVisitedChecklistScreen: screen }),

      showDateText: true,
      setShowDateText: (show) => set({ showDateText: show }),
      isWeekView: true,
      setIsWeekView: (isWeek) => set({ isWeekView: isWeek }),

      clearAllChecklists: () =>
        set({
          checklistData: {},
          routines: [],
          categories: [
            { id: 'cat1', name: '오늘의 루틴' },
            { id: 'cat2', name: '업무 및 학업' },
            { id: 'cat3', name: '개인 및 기타' },
          ],
          showDateText: true, // 기본값
          isWeekView: false, // 기본값
        }),

      // 🔥 할 일 관련 설정만 초기화하는 함수
      resetChecklistSettings: () =>
        set({
          showDateText: true,
          isWeekView: true,
        }),
    }),
    {
      name: 'checklist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
