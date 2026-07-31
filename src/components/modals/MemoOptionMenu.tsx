import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import Toast from 'react-native-toast-message'; // 💡 토스트 임포트 추가
import {
  BackIcon,
  PinIcon,
  PinUnsetIcon,
  LockIcon,
  CameraIcon,
  ImageIcon,
  FileIcon,
  PdfIcon,
  TrashIcon,
} from '@/assets/icons';

interface MemoOptionMenuProps {
  visible: boolean;
  onClose: () => void;
  isFocused: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isDark: boolean;
  onAttachImage: () => void;
  onPasteImage: () => void;
  onAttachFile: () => void;
  onTogglePin: () => void;
  onToggleLock: () => void;
  onExportPdf: () => void;
  onDelete: () => void;
}

export default function MemoOptionMenu({
  visible,
  onClose,
  isFocused,
  isPinned,
  isLocked,
  isDark,
  onAttachImage,
  onPasteImage,
  onAttachFile,
  onTogglePin,
  onToggleLock,
  onExportPdf,
  onDelete,
}: MemoOptionMenuProps) {
  if (!visible) return null;

  // 💡 비활성화된 항목을 눌렀을 때 공통으로 사용할 핸들러
  const handleDisabledPress = () => {
    Toast.show({
      type: 'info',
      text1: '수정 중일 때 사용 가능해요',
      position: 'top',
      topOffset: 60,
    });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <AppTouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menuBox, isDark && styles.darkMenuBox]}>
          {/* 🔥 최상단 가로형 메뉴 (고정, 잠금) */}
          <View style={styles.topActionsContainer}>
            <AppTouchableOpacity
              style={styles.topActionBtn}
              onPress={onTogglePin}
            >
              {isPinned ? (
                <PinIcon
                  width={20}
                  height={20}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              ) : (
                <PinUnsetIcon
                  width={20}
                  height={20}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}
              <AppText
                style={[styles.topActionText, isDark && styles.darkText]}
              >
                {isPinned ? '고정 해제' : '고정'}
              </AppText>
            </AppTouchableOpacity>

            {/* 세로 구분선 */}
            <View
              style={[styles.verticalDivider, isDark && styles.darkDivider]}
            />

            <AppTouchableOpacity
              style={styles.topActionBtn}
              onPress={onToggleLock}
            >
              <LockIcon
                width={20}
                height={20}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText
                style={[styles.topActionText, isDark && styles.darkText]}
              >
                {isLocked ? '잠금 해제' : '잠금'}
              </AppText>
            </AppTouchableOpacity>
          </View>

          {/* 🔥 상단 메뉴 아래 구분선 */}
          <View style={[styles.divider, isDark && styles.darkDivider]} />

          {/* 나머지 세로형 메뉴들 */}
          <AppTouchableOpacity
            style={[
              styles.menuItem,
              isDark && styles.darkMenuItem,
              !isFocused && { opacity: 0.2 },
            ]}
            onPress={isFocused ? onAttachImage : handleDisabledPress} // 💡 수정 모드가 아닐 때 토스트 출력
          >
            <CameraIcon
              width={20}
              height={20}
              color={isDark ? '#ffffff' : '#111111'}
            />
            <AppText style={[styles.menuText, isDark && styles.darkText]}>
              사진 첨부하기
            </AppText>
          </AppTouchableOpacity>

          <AppTouchableOpacity
            style={[
              styles.menuItem,
              isDark && styles.darkMenuItem,
              !isFocused && { opacity: 0.2 },
            ]}
            onPress={isFocused ? onPasteImage : handleDisabledPress} // 💡 수정 모드가 아닐 때 토스트 출력
          >
            <ImageIcon
              width={20}
              height={20}
              color={isDark ? '#ffffff' : '#111111'}
            />
            <AppText style={[styles.menuText, isDark && styles.darkText]}>
              복사한 이미지 붙여넣기
            </AppText>
          </AppTouchableOpacity>

          <AppTouchableOpacity
            style={[
              styles.menuItem,
              isDark && styles.darkMenuItem,
              !isFocused && { opacity: 0.2 },
            ]}
            onPress={isFocused ? onAttachFile : handleDisabledPress} // 💡 수정 모드가 아닐 때 토스트 출력
          >
            <FileIcon
              width={20}
              height={20}
              color={isDark ? '#ffffff' : '#111111'}
            />
            <AppText style={[styles.menuText, isDark && styles.darkText]}>
              파일 첨부하기
            </AppText>
          </AppTouchableOpacity>

          <AppTouchableOpacity
            style={[styles.menuItem, isDark && styles.darkMenuItem]}
            onPress={onExportPdf}
          >
            <PdfIcon
              width={20}
              height={20}
              color={isDark ? '#ffffff' : '#111111'}
            />
            <AppText style={[styles.menuText, isDark && styles.darkText]}>
              PDF로 내보내기
            </AppText>
          </AppTouchableOpacity>

          <AppTouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={onDelete}
          >
            <TrashIcon width={20} height={20} color="#FF6262" />
            <AppText style={styles.deleteText}>삭제</AppText>
          </AppTouchableOpacity>
        </View>
      </AppTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuBox: {
    backgroundColor: '#ffffff',
    width: 220,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // elevation: 16,
    overflow: 'hidden',
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  topActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  topActionText: {
    fontSize: 13,
    color: '#111',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f3',
  },
  menuText: {
    fontSize: 13,
    color: '#111',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  darkMenuItem: {
    borderBottomColor: '#333',
  },
  darkText: {
    color: '#fff',
  },
  deleteText: {
    fontSize: 13,
    color: '#FF6262',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f2f3',
    marginHorizontal: 12,
  },
  verticalDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#f1f2f3',
  },
  darkDivider: {
    backgroundColor: '#333',
  },
});
