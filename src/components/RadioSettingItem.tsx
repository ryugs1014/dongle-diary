import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';

interface RadioSettingItemProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  isDark?: boolean;
  fontFamily?: string;
}

export default function RadioSettingItem({
  title,
  isSelected,
  onPress,
  isDark,
  fontFamily,
}: RadioSettingItemProps) {
  return (
    <AppTouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <AppText
          style={[
            styles.settingTitle,
            isDark && styles.darkText,
            fontFamily ? { fontFamily } : undefined,
          ]}
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
    flexDirection: 'column',
    justifyContent: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 14,
    color: '#333',
  },
  darkText: {
    color: '#ffffff',
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
