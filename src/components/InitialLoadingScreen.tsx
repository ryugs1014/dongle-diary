import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useDiaryStore } from '../store/useDiaryStore';
import { LogoIcon } from '@/assets/icons';

export default function InitialLoadingScreen() {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.contentWrapper}>
        <LogoIcon width={100} height={150} color={isDark ? 'white' : 'black'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkContainer: {
    backgroundColor: '#111111',
  },
  contentWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
});
