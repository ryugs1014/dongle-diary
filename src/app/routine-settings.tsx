import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import {
  AddMemoIcon,
  BackIcon,
  DetailDeleteIcon,
  DetailEditIcon,
  DownIcon,
  OrderIcon,
  UpIcon,
  WriteIcon,
} from '@/assets/icons';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useChecklistStore, Routine } from '@/store/useChecklistStore';
import AppConfirmModal from '@/components/modals/AppConfirmModal';

// 🔥 분리한 모달 임포트
import RoutineDetailModal from '@/components/modals/RoutineDetailModal';
import SvgDashedLine from '@/components/ui/SvgDashedLine';

export default function RoutineSettingsScreen() {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const { routines, deleteRoutine, reorderRoutine } = useChecklistStore();

  const [isEditMode, setIsEditMode] = useState(false);

  // 모달 제어 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // 삭제 모달 상태
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  const handleOpenModal = (routine?: Routine) => {
    setEditingRoutine(routine || null);
    setModalVisible(true);
  };

  const handleDeleteClick = (routine: Routine) => {
    setRoutineToDelete(routine);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (routineToDelete) {
      deleteRoutine(routineToDelete.id);
    }
    setDeleteModalVisible(false);
    setRoutineToDelete(null);

    Toast.show({
      type: 'success',
      text1: '루틴이 삭제되었어요',
      position: 'top',
      topOffset: 60,
    });
  };

  const handleGoToCategory = () => {
    setTimeout(() => {
      router.push('/category-settings');
    }, 300);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
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
            루틴 관리
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? (
              <WriteIcon
                width={28}
                height={28}
                color={isDark ? '#fff' : '#111'}
              />
            ) : (
              <OrderIcon
                width={28}
                height={28}
                color={isDark ? '#fff' : '#111'}
              />
            )}
          </AppTouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollWrapper}>
        {routines.map((routine, index) => (
          <AppTouchableOpacity
            key={routine.id}
            style={[styles.routineItem, isDark && styles.darkRoutineItem]}
            onPress={() => !isEditMode && handleOpenModal(routine)}
            activeOpacity={isEditMode ? 1 : 0.7}
          >
            <View style={styles.routineInfo}>
              <AppText
                style={[styles.routineText, isDark && styles.darkText]}
                numberOfLines={1}
              >
                {routine.text}
              </AppText>
              <AppText style={styles.routineSubText}>
                {routine.repeatType === 'daily'
                  ? '매일'
                  : routine.repeatType === 'weekly'
                    ? '매주'
                    : routine.repeatType === 'monthly'
                      ? '매월'
                      : '매년'}{' '}
                반복 · 카테고리 {routine.categoryIds.length}개
              </AppText>
            </View>

            <View style={styles.actionButtons}>
              {isEditMode ? (
                <>
                  <AppTouchableOpacity
                    onPress={() => reorderRoutine(routine.id, 'up')}
                    disabled={index === 0}
                    style={{
                      opacity: index === 0 ? 0.3 : 1,
                    }}
                  >
                    <UpIcon
                      width={24}
                      height={24}
                      color={isDark ? '#fffFFf' : '#333'}
                    />
                  </AppTouchableOpacity>
                  <AppTouchableOpacity
                    onPress={() => reorderRoutine(routine.id, 'down')}
                    disabled={index === routines.length - 1}
                    style={{
                      opacity: index === routines.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <DownIcon
                      width={24}
                      height={24}
                      color={isDark ? '#fffFFf' : '#333'}
                    />
                  </AppTouchableOpacity>
                </>
              ) : (
                <>
                  <AppTouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenModal(routine)}
                  >
                    <DetailEditIcon
                      width={24}
                      height={24}
                      color={isDark ? '#fffFFf' : '#333'}
                    />
                  </AppTouchableOpacity>
                  <AppTouchableOpacity
                    onPress={() => handleDeleteClick(routine)}
                  >
                    <DetailDeleteIcon width={24} height={24} color="#FF6262" />
                  </AppTouchableOpacity>
                </>
              )}
            </View>
          </AppTouchableOpacity>
        ))}

        {!isEditMode && (
          <AppTouchableOpacity
            style={styles.addBtn}
            onPress={() => handleOpenModal()}
          >
            <AddMemoIcon
              width={24}
              height={24}
              color={isDark ? '#ffffff' : '#111111'}
            />
            <AppText
              style={[styles.addBtnText, isDark && styles.addBtnTextDark]}
            >
              신규 루틴 추가
            </AppText>
          </AppTouchableOpacity>
        )}

        {!isEditMode && (
          <View style={styles.dividerWrapper}>
            <SvgDashedLine />
          </View>
        )}

        {!isEditMode && (
          <View style={styles.emptyContainer}>
            <AppText style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              필요한 카테고리가 없나요?{'\n'}새로운 카테고리를 빠르게
              만들어보세요
            </AppText>

            <AppTouchableOpacity
              style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
              onPress={handleGoToCategory}
            >
              <AppText
                style={[
                  styles.emptyButtonText,
                  isDark && styles.emptyButtonTextDark,
                ]}
              >
                카테고리 관리하기
              </AppText>
            </AppTouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 🔥 외부로 분리한 디테일 설정 모달 */}
      <RoutineDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialRoutine={editingRoutine}
        isDark={isDark}
      />

      {/* 삭제 확인용 모달 */}
      <AppConfirmModal
        visible={deleteModalVisible}
        title="삭제 확인"
        message={
          routineToDelete ? `'${routineToDelete.text}' 루틴을 삭제할까요?` : ''
        }
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        confirmText="삭제"
        confirmColor="#FF6262"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: { backgroundColor: '#111111' },
  leftIconsWrapper: { flex: 1, alignItems: 'flex-start' },
  headerTitleWrapper: { flex: 2, alignItems: 'center' },
  customHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  rightIconsWrapper: { flex: 1, alignItems: 'flex-end' },
  darkText: { color: '#ffffff' },
  scrollWrapper: { paddingVertical: 10, paddingHorizontal: 20, gap: 16 },

  routineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    // elevation: 16,
    marginBottom: 16,
    gap: 8,
  },
  darkRoutineItem: { backgroundColor: '#1e1e1e', borderColor: '#333' },
  routineInfo: { flex: 1 },
  routineText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 1,
  },
  routineSubText: { fontSize: 12, color: '#888', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  iconBtn: {},
  addBtn: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  addBtnTextDark: {
    color: '#ffffff',
  },

  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 10 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 10,
  },
  emptyTextDark: { color: '#aaa' },
  emptyButton: {
    backgroundColor: '#111111',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyButtonDark: { backgroundColor: '#ffffff' },
  emptyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  emptyButtonTextDark: { color: '#111111' },
});
