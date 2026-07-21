import { ImageSourcePropType } from 'react-native';

export interface EmotionData {
  id: string;
  label: string;
  source: ImageSourcePropType;
  animatedSource: ImageSourcePropType;
}

export const EMOTIONS_DATA: EmotionData[] = [
  {
    id: 'joy',
    label: '기쁨',
    source: require('../../assets/emotions/joy.png'),
    animatedSource: require('../../assets/emotions/animations/joy.png'),
  },
  {
    id: 'excited',
    label: '신남',
    source: require('../../assets/emotions/excited.png'),
    animatedSource: require('../../assets/emotions/animations/excited.png'),
  },
  {
    id: 'calm',
    label: '평온',
    source: require('../../assets/emotions/calm.png'),
    animatedSource: require('../../assets/emotions/animations/calm.png'),
  },
  {
    id: 'happy',
    label: '행복',
    source: require('../../assets/emotions/happy.png'),
    animatedSource: require('../../assets/emotions/animations/happy.png'),
  },
  {
    id: 'pleasant',
    label: '기분좋은',
    source: require('../../assets/emotions/pleasant.png'),
    animatedSource: require('../../assets/emotions/animations/pleasant.png'),
  },
  {
    id: 'hopeful',
    label: '기대',
    source: require('../../assets/emotions/hopeful.png'),
    animatedSource: require('../../assets/emotions/animations/hopeful.png'),
  },
  {
    id: 'love',
    label: '사랑',
    source: require('../../assets/emotions/love.png'),
    animatedSource: require('../../assets/emotions/animations/love.png'),
  },
  {
    id: 'hurt',
    label: '아픔',
    source: require('../../assets/emotions/hurt.png'),
    animatedSource: require('../../assets/emotions/animations/hurt.png'),
  },
  {
    id: 'sad',
    label: '슬픔',
    source: require('../../assets/emotions/sad.png'),
    animatedSource: require('../../assets/emotions/animations/sad.png'),
  },
  {
    id: 'tired',
    label: '피곤',
    source: require('../../assets/emotions/tired.png'),
    animatedSource: require('../../assets/emotions/animations/tired.png'),
  },
  {
    id: 'stressed',
    label: '스트레스',
    source: require('../../assets/emotions/stressed.png'),
    animatedSource: require('../../assets/emotions/animations/stressed.png'),
  },
  {
    id: 'angry',
    label: '분노',
    source: require('../../assets/emotions/angry.png'),
    animatedSource: require('../../assets/emotions/animations/angry.png'),
  },
  {
    id: 'annoyed',
    label: '짜증',
    source: require('../../assets/emotions/annoyed.png'),
    animatedSource: require('../../assets/emotions/animations/annoyed.png'),
  },
  {
    id: 'surprised',
    label: '놀람',
    source: require('../../assets/emotions/surprised.png'),
    animatedSource: require('../../assets/emotions/animations/surprised.png'),
  },
  {
    id: 'exhausted',
    label: '지침',
    source: require('../../assets/emotions/exhausted.png'),
    animatedSource: require('../../assets/emotions/animations/exhausted.png'),
  },
  {
    id: 'flustered',
    label: '당황',
    source: require('../../assets/emotions/flustered.png'),
    animatedSource: require('../../assets/emotions/animations/flustered.png'),
  },
  {
    id: 'cool',
    label: '멋짐',
    source: require('../../assets/emotions/cool.png'),
    animatedSource: require('../../assets/emotions/animations/cool.png'),
  },
  {
    id: 'teasing',
    label: '놀림',
    source: require('../../assets/emotions/teasing.png'),
    animatedSource: require('../../assets/emotions/animations/teasing.png'),
  },
];

export const EMOTION_IMAGE_MAP: Record<string, ImageSourcePropType> =
  EMOTIONS_DATA.reduce(
    (acc, emotion) => {
      acc[emotion.id] = emotion.source;
      return acc;
    },
    {} as Record<string, ImageSourcePropType>,
  );

export const ANIMATED_EMOTION_IMAGE_MAP: Record<string, ImageSourcePropType> =
  EMOTIONS_DATA.reduce(
    (acc, emotion) => {
      acc[emotion.id] = emotion.animatedSource;
      return acc;
    },
    {} as Record<string, ImageSourcePropType>,
  );
