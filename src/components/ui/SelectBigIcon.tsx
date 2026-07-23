import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const SelectBigIcon = ({
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
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.75012 30.0921C5.75012 11.8368 11.837 5.74997 30.0922 5.74997C48.3475 5.74997 54.4343 11.8368 54.4343 30.0921C54.4343 48.3473 48.3475 54.4342 30.0922 54.4342C11.837 54.4342 5.75012 48.3473 5.75012 30.0921Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.1005 30.0002L27.0355 35.9327L38.9005 24.0677"
        stroke={stroke}
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
