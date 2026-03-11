export const FACILITY_ICON_MAP = [
  { keys: ['wifi', '와이파이'], icon: '🛜' },
  { keys: ['주차'], icon: '🅿️' },
  { keys: ['세탁', '빨래'], icon: '🧺' },
  { keys: ['헬스', 'gym', 'fitness', '체력', '단련'], icon: '🏋️' },
  { keys: ['요가'], icon: '🤸🏻‍♂️' },
  { keys: ['엘리베이터', '승강기'], icon: '🛗' },
  { keys: ['카페', '커피', '음료'], icon: '☕' },
  { keys: ['영화', '미디어'], icon: '🍿' },
  { keys: ['주방', '키친'], icon: '🍳' },
  { keys: ['독서', '스터디'], icon: '📚' },
  { keys: ['라운지', '휴게', '휴식'], icon: '😴' },
  { keys: ['보안', 'cctv'], icon: '🛡️' },
  { keys: ['택배'], icon: '📦' },
  { keys: ['수영'], icon: '🏊' },
  { keys: ['워킹', '작업', '컴퓨터'], icon: '💻' },
  { keys: ['회의', '미팅'], icon: '💬' },
  { keys: ['게임', 'game', 'Game', '오락'], icon: '🎮' },
];


export function getFacilityIcon(name) {
  const text = String(name || '');
  const lower = text.toLowerCase();
  const hit = FACILITY_ICON_MAP.find((entry) =>
    entry.keys.some((k) => lower.includes(String(k).toLowerCase()))
  );
  return hit?.icon || '🪟';
}

