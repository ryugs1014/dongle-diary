export const FONT_SIZES = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18,
} as const;

// 💡 서체 목록도 이곳으로 옮겨와서 한 번에 관리합니다.
export const FONTS = [
  // { id: 'System', label: '시스템 기본 서체' },
  { id: 'NanumSquareRound', label: '나눔스퀘어라운드' },
  { id: 'KyoboHandwriting', label: '교보문고 손글씨' },
  { id: 'GowunBatang', label: '고운바탕' },
  { id: 'IsYun', label: '이서윤체' },
] as const;
