import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import {
  BackIcon,
  DetailDeleteIcon,
  DetailEditIcon,
  AddMemoIcon,
  DownIcon,
  UpIcon,
  OrderIcon,
  WriteIcon,
  SearchIcon,
} from '@/assets/icons';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useChecklistStore } from '@/store/useChecklistStore';
import Toast from 'react-native-toast-message';

import AppPromptModal from '@/components/modals/AppPromptModal';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import SvgDashedLine from '@/components/ui/SvgDashedLine';

export default function CategorySettingsScreen() {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
  } = useChecklistStore();

  // 상태 관리
  const [isEditMode, setIsEditMode] = useState(false);

  // AppPromptModal (추가/수정) 제어 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  // AppConfirmModal (삭제) 제어 상태
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [catToDelete, setCatToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleOpenAddModal = () => {
    setEditingCatId(null);
    setInputText('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (id: string, currentName: string) => {
    setEditingCatId(id);
    setInputText(currentName);
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    const trimmed = inputText.trim();
    if (!trimmed)
      return setTimeout(() => {
        setModalVisible(false);

        Toast.show({
          type: 'info',
          text1: '카테고리 이름을 입력하세요',
          position: 'top',
          topOffset: 60,
        });
      }, 300);

    if (editingCatId) {
      updateCategory(editingCatId, trimmed);
    } else {
      addCategory(trimmed);
    }
    setModalVisible(false);

    return Toast.show({
      type: 'success',
      text1: '카테고리가 추가 되었어요',
      position: 'top',
      topOffset: 60,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (categories.length <= 1) {
      // 카테고리가 1개 이하일 때의 경고는 일반 Alert로 유지하거나, 다른 알림 방식을 사용할 수 있습니다.
      return Toast.show({
        type: 'info',
        text1: '최소 한 개의 카테고리가 필요해요',
        position: 'top',
        topOffset: 60,
      });
    }
    // 삭제 대상 정보를 저장하고 삭제 확인 모달을 띄웁니다.
    setCatToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (catToDelete) {
      deleteCategory(catToDelete.id);
    }
    setDeleteModalVisible(false);
    setCatToDelete(null);

    return Toast.show({
      type: 'success',
      text1: '카테고리가 삭제 되었어요',
      position: 'top',
      topOffset: 60,
    });
  };

  const handleGoToRoutine = () => {
    setTimeout(() => {
      router.push('/routine-settings');
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
            카테고리 관리
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

      <ScrollView
        style={styles.scrollWrapper}
        // contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        {categories.map((cat, index) => (
          <View
            key={cat.id}
            style={[styles.categoryItem, isDark && styles.darkCategoryItem]}
          >
            <View style={styles.categoryInfo}>
              <AppText
                style={[styles.categoryName, isDark && styles.darkText]}
                numberOfLines={1}
              >
                {cat.name}
              </AppText>
            </View>

            <View style={styles.actionButtons}>
              {isEditMode ? (
                <>
                  <AppTouchableOpacity
                    onPress={() => reorderCategory(cat.id, 'up')}
                    style={[styles.iconBtn, index === 0 && { opacity: 0.2 }]}
                    disabled={index === 0}
                  >
                    <UpIcon
                      width={24}
                      height={24}
                      color={isDark ? '#fffFFf' : '#333'}
                    />
                  </AppTouchableOpacity>
                  <AppTouchableOpacity
                    onPress={() => reorderCategory(cat.id, 'down')}
                    style={[
                      styles.iconBtn,
                      index === categories.length - 1 && { opacity: 0.2 },
                    ]}
                    disabled={index === categories.length - 1}
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
                    onPress={() => handleOpenEditModal(cat.id, cat.name)}
                  >
                    <DetailEditIcon
                      width={24}
                      height={24}
                      color={isDark ? '#fffFFf' : '#333'}
                    />
                  </AppTouchableOpacity>
                  <AppTouchableOpacity
                    style={[
                      styles.iconBtn,
                      categories.length <= 1 && { opacity: 0.3 },
                    ]}
                    onPress={() => handleDelete(cat.id, cat.name)}
                    disabled={categories.length <= 1}
                  >
                    <DetailDeleteIcon width={24} height={24} color="#FF6262" />
                  </AppTouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {!isEditMode && (
          <AppTouchableOpacity
            style={styles.addBtn}
            onPress={handleOpenAddModal}
          >
            <AddMemoIcon
              width={24}
              height={24}
              color={isDark ? '#ffffff' : '#111111'}
            />
            <AppText
              style={[styles.addBtnText, isDark && styles.addBtnTextDark]}
            >
              신규 카테고리 추가
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
              자주 하는 일이 있나요?{'\n'}반복 루틴으로 추가하면 편리해요
            </AppText>

            <AppTouchableOpacity
              style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
              onPress={handleGoToRoutine}
            >
              <AppText
                style={[
                  styles.emptyButtonText,
                  isDark && styles.emptyButtonTextDark,
                ]}
              >
                루틴 관리하기
              </AppText>
            </AppTouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 🔥 1. 등록/수정 프롬프트 모달 */}
      <AppPromptModal
        visible={modalVisible}
        title={editingCatId ? '카테고리 수정' : '카테고리 추가'}
        value={inputText}
        onChangeText={setInputText}
        placeholder="카테고리 이름"
        onCancel={() => setModalVisible(false)}
        onConfirm={handleSaveModal}
        confirmColor="#FF5900"
      />

      {/* 🔥 2. 삭제 확인 모달 */}
      <AppConfirmModal
        visible={deleteModalVisible}
        title="삭제 확인"
        message={
          catToDelete
            ? `'${catToDelete.name}' 카테고리를 삭제할까요?\n포함된 항목은 모두 삭제되요`
            : ''
        }
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        confirmText="삭제"
        confirmColor="#FF6262" // Destructive Red
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

  categoryItem: {
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
  darkCategoryItem: { backgroundColor: '#1e1e1e', borderColor: '#333' },
  categoryInfo: { flex: 1 },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 1,
  },
  actionButtons: { flexDirection: 'row', gap: 8 },
  // iconBtn: { padding: 4 },

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
