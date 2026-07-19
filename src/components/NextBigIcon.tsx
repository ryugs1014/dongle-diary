import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const NextBigIcon = ({
  stroke = 'black',
  fill = 'transparent',
  width = 60,
  height = 60,
  ...props
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 60 60"
      fill="none"
      {...props}
    >
      {/* 💡 2. 첫 번째 Path(바깥 동그라미)에 fill과 stroke 속성을 연결합니다. */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30 53.125C47.3425 53.125 53.125 47.3425 53.125 30C53.125 12.6575 47.3425 6.875 30 6.875C12.6575 6.875 6.875 12.6575 6.875 30C6.875 47.3425 12.6575 53.125 30 53.125Z"
        fill={fill} // 변경됨: currentColor -> fill
        stroke={stroke} // 변경됨: currentColor -> stroke
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 💡 3. 나머지 Path(화살표 모양)들은 선이므로 stroke만 연결합니다. */}
      <Path
        d="M40.2145 30H19.7845"
        stroke={stroke} // 변경됨: currentColor -> stroke
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M30.8044 20.6201C30.8044 20.6201 40.2144 26.9401 40.2144 30.0001C40.2144 33.0601 30.8044 39.3701 30.8044 39.3701"
        stroke={stroke} // 변경됨: currentColor -> stroke
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
