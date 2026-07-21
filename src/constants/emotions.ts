import { ImageSourcePropType } from 'react-native';

export interface EmotionData {
  id: string;
  label: string;
  source: ImageSourcePropType;
}

export const EMOTIONS_DATA: EmotionData[] = [
  {
    id: 'joy',
    label: '기쁨',
    source: require('../../assets/emotions/joy.png'),
  },
  {
    id: 'excited',
    label: '신남',
    source: require('../../assets/emotions/excited.png'),
  },
  {
    id: 'calm',
    label: '평온',
    source: require('../../assets/emotions/calm.png'),
  },
  {
    id: 'happy',
    label: '행복',
    source: require('../../assets/emotions/happy.png'),
  },
  {
    id: 'pleasant',
    label: '기분좋은',
    source: require('../../assets/emotions/pleasant.png'),
  },
  {
    id: 'hopeful',
    label: '기대',
    source: require('../../assets/emotions/hopeful.png'),
  },
  {
    id: 'love',
    label: '사랑',
    source: require('../../assets/emotions/love.png'),
  },
  {
    id: 'hurt',
    label: '아픔',
    source: require('../../assets/emotions/hurt.png'),
  },
  {
    id: 'sad',
    label: '슬픔',
    source: require('../../assets/emotions/sad.png'),
  },
  {
    id: 'tired',
    label: '피곤',
    source: require('../../assets/emotions/tired.png'),
  },
  {
    id: 'stressed',
    label: '스트레스',
    source: require('../../assets/emotions/stressed.png'),
  },
  {
    id: 'angry',
    label: '분노',
    source: require('../../assets/emotions/angry.png'),
  },
  {
    id: 'annoyed',
    label: '짜증',
    source: require('../../assets/emotions/annoyed.png'),
  },
  {
    id: 'surprised',
    label: '놀람',
    source: require('../../assets/emotions/surprised.png'),
  },
  {
    id: 'exhausted',
    label: '지침',
    source: require('../../assets/emotions/exhausted.png'),
  },
  {
    id: 'flustered',
    label: '당황',
    source: require('../../assets/emotions/flustered.png'),
  },
  {
    id: 'cool',
    label: '멋짐',
    source: require('../../assets/emotions/cool.png'),
  },
  {
    id: 'teasing',
    label: '놀림',
    source: require('../../assets/emotions/teasing.png'),
  },
];

// 💡 팁: ID를 넣으면 이미지를 바로 뱉어내는 딕셔너리(객체)를 함께 만들어 둡니다.
// 추후 DiaryDetailScreen이나 WriteScreen에서 아주 유용하게 쓰입니다.
export const EMOTION_IMAGE_MAP: Record<string, ImageSourcePropType> =
  EMOTIONS_DATA.reduce(
    (acc, emotion) => {
      acc[emotion.id] = emotion.source;
      return acc;
    },
    {} as Record<string, ImageSourcePropType>,
  );
