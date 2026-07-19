import React from 'react';
import { useColorScheme, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useDiaryStore } from '@/store/useDiaryStore';

const SvgDashedLine = () => {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  return (
    <View style={{ width: '100%', height: 1 }}>
      <Svg height="100%" width="100%">
        <Line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          stroke={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(33, 37, 41, 0.2)'}
          strokeWidth="1"
          strokeDasharray="10, 10"
        />
      </Svg>
    </View>
  );
};

export default SvgDashedLine;
