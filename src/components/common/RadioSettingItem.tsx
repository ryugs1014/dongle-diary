import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';

import {
  FolderIcon,
  DocumentIcon,
  SearchIcon,
  DownloadIcon,
} from '@/assets/icons';

const ICON_MAP: Record<string, React.ElementType> = {
  folder: FolderIcon,
  document: DocumentIcon,
  search: SearchIcon,
  download: DownloadIcon,
};

interface RadioSettingItemProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  isDark?: boolean;
  fontFamily?: string;
  // 🔥 다양한 형태(문자열 매핑, 이모지 문자열, SVG 컴포넌트)를 받을 수 있도록 수정
  icon?: string | React.ElementType;
}

export default function RadioSettingItem({
  title,
  isSelected,
  onPress,
  isDark,
  fontFamily,
  icon,
}: RadioSettingItemProps) {
  // 🔥 넘어온 icon Prop을 분석해서 적절한 형태로 렌더링하는 헬퍼 함수
  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      // 1. ICON_MAP에 이름이 정의된 경우 (예: 'folder')
      const MappedIcon = ICON_MAP[icon];
      if (MappedIcon) {
        return (
          <MappedIcon width={24} height={24} color={isDark ? '#777' : '#999'} />
        );
      }
      // 2. ICON_MAP에 없다면 이모지(또는 일반 문자열)로 간주하고 텍스트로 렌더링 (예: '📁')
      return <AppText style={{ fontSize: 16 }}>{icon}</AppText>;
    }

    // 3. SVG 컴포넌트 자체가 전달된 경우 (예: FolderIcon)
    const IconComponent = icon as React.ElementType;
    return (
      <IconComponent width={24} height={24} color={isDark ? '#777' : '#999'} />
    );
  };

  return (
    <AppTouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        {icon && <View style={styles.iconWrapper}>{renderIcon()}</View>}

        <AppText
          style={[
            styles.settingTitle,
            isDark && styles.darkText,
            fontFamily && styles.fontFamilyStyle,
            fontFamily ? { fontFamily } : undefined,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </AppText>
      </View>

      <View style={styles.settingRight}>
        <View
          style={[
            styles.radioOuter,
            isDark && styles.radioOuterDark,
            isSelected && styles.radioOuterSelected,
            isDark && isSelected && styles.darkRadioOuterSelected,
          ]}
        >
          {isSelected && (
            <View
              style={[styles.radioInner, isDark && styles.radioInnerDark]}
            />
          )}
        </View>
      </View>
    </AppTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24, // 이모지와 SVG간 정렬 밸런스를 맞추기 위해 너비 고정 권장
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  darkText: {
    color: '#ffffff',
  },
  fontFamilyStyle: {
    fontSize: 16,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e2e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterDark: {
    borderColor: '#333333',
  },
  radioOuterSelected: {
    borderColor: '#111111',
  },
  darkRadioOuterSelected: {
    borderColor: '#ffffff',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#111111',
  },
  radioInnerDark: {
    backgroundColor: '#ffffff',
  },
});
