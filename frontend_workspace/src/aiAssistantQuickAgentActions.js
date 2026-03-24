export const ACTIONS = [
  { id: 'roomRecommend', label: '방 찾기', prompt: '방 찾기', aliases: ['방추천', '방추천해줘', '방찾기', '추천방', '인기방', '인기있는방보기'], related: ['roomRegister', 'tour', 'wishlist'], mode: 'direct' },
  { id: 'roomRegister', label: '방 등록', prompt: '방 등록', aliases: ['방등록', '매물등록', '등록하기'], related: ['roomRecommend', 'tour', 'contract'], mode: 'direct' },
  { id: 'reserve', label: '예약', prompt: '공용시설 예약', aliases: ['시설예약', '공용시설예약', '예약하기'], related: ['facilityHours', 'reservationStatus', 'facilityCancel'], mode: 'direct' },
  { id: 'summary', label: '요약', prompt: '현재 페이지 요약', aliases: ['페이지요약', '내용요약', '설명요약'], related: ['notices', 'roomRecommend', 'wishlist'], mode: 'direct' },
  { id: 'facilityHours', label: '이용시간', prompt: '공용시설 이용시간', aliases: ['운영시간', '몇시까지', '시설시간'], related: ['reserve', 'reservationStatus', 'facilityCancel'], mode: 'direct' },
  { id: 'facilityCancel', label: '예약취소', prompt: '공용시설 예약 취소', aliases: ['취소', '예약취소', '시설취소'], related: ['reservationStatus', 'reserve', 'facilityHours'], mode: 'direct' },
  { id: 'reservationStatus', label: '예약내역', prompt: '예약 내역 확인', aliases: ['예약현황', '내예약', '예약목록'], related: ['facilityCancel', 'reserve', 'facilityHours'], mode: 'direct' },
  { id: 'wishlist', label: '찜목록', prompt: '찜한 방 확인', aliases: ['찜', '위시리스트', '좋아요'], related: ['roomRecommend', 'tour', 'contract'], mode: 'direct' },
  { id: 'contract', label: '계약내역', prompt: '계약 관련 확인', aliases: ['계약', '전자계약', '계약서', '계약목록'], related: ['tour', 'wishlist', 'mypage'], mode: 'direct' },
  { id: 'tour', label: '투어내역', prompt: '투어 신청 안내', aliases: ['투어', '방보러가기', '방투어', '투어목록'], related: ['roomRecommend', 'contract', 'wishlist'], mode: 'direct' },
  { id: 'notices', label: '공지사항', prompt: '공지사항 보기', aliases: ['공지', '공지페이지', '운영공지'], related: ['summary', 'mypage', 'roomRecommend'], mode: 'direct' },
  { id: 'mypage', label: '마이페이지', prompt: '마이페이지 이동', aliases: ['내정보', '회원정보', '프로필', '마이'], related: ['wishlist', 'contract', 'tour'], mode: 'direct' },
];

export const STARTER_ACTION_IDS = ['roomRecommend', 'roomRegister', 'reserve', 'summary'];
export const VOICE_CONFIRM_ACTIONS = new Set(['reserve', 'facilityCancel']);
const YES_TOKENS = ['예', '네', '응', '맞아', '좋아', '확인', '진행'];
const NO_TOKENS = ['아니오', '아니', '취소', '중지', '그만', '싫어'];

export const ACTION_MAP = ACTIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

export const normalizeText = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '');
const getActionTokens = (action) => [action.label, action.prompt, ...(action.aliases || [])].map(normalizeText).filter(Boolean);
const getDirectTriggerTokens = (action) => [action.label, ...(action.aliases || [])].map(normalizeText).filter(Boolean);
export const uniqActionIds = (ids) => {
  const seen = new Set();
  return ids.filter((id) => ACTION_MAP[id] && !seen.has(id) && seen.add(id));
};
export const matchActionIds = (value, options = {}) => {
  const text = normalizeText(value);
  if (!text) return [];
  return ACTIONS.map((action) => {
    if (options.directOnly && action.mode !== 'direct') return { id: action.id, score: 0 };
    const score = getActionTokens(action).reduce((max, token) => {
      if (!token || !text.includes(token)) return max;
      return Math.max(max, token.length);
    }, 0);
    return { id: action.id, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.id);
};
export const detectQuickAction = (value) => {
  const text = normalizeText(value);
  if (!text) return null;
  return ACTIONS.find((action) => getDirectTriggerTokens(action).some((token) => token === text))?.id || null;
};
export const suggestActionsFromText = (value) => matchActionIds(value);
export const expandRelatedActionIds = (ids, limit = 3) => {
  const selected = uniqActionIds(ids);
  const result = [...selected];
  for (let i = 0; i < selected.length && result.length < limit; i += 1) {
    const current = ACTION_MAP[selected[i]];
    (current?.related || []).forEach((relatedId) => {
      if (result.length < limit && ACTION_MAP[relatedId] && !result.includes(relatedId)) result.push(relatedId);
    });
  }
  return result.slice(0, limit);
};
export const isYes = (value) => YES_TOKENS.some((token) => normalizeText(value).includes(normalizeText(token)));
export const isNo = (value) => NO_TOKENS.some((token) => normalizeText(value).includes(normalizeText(token)));
