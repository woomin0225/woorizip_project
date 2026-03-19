export const ACTIONS = [
  { id: 'reserve', label: '예약', prompt: '공용시설 예약', aliases: ['시설예약', '공용시설예약', '예약하기'], related: ['facilityHours', 'reservationStatus', 'facilityCancel'], mode: 'direct' },
  { id: 'summary', label: '요약', prompt: '현재 페이지 요약', aliases: ['페이지요약', '내용요약', '설명요약'], related: ['roomRecommend', 'facilityInfo', 'reviews'], mode: 'direct' },
  { id: 'roomRecommend', label: '방 추천', prompt: '방 추천', aliases: ['방추천', '추천방', '인기방', '인기있는방보기'], related: ['availableRooms', 'deposit', 'monthlyRent'], mode: 'direct' },
  { id: 'facilityHours', label: '이용시간', prompt: '공용시설 이용시간', aliases: ['운영시간', '몇시까지', '시설시간'], related: ['reserve', 'facilityInfo', 'facilityCancel'], mode: 'direct' },
  { id: 'facilityCancel', label: '예약취소', prompt: '공용시설 예약 취소', aliases: ['취소', '예약취소', '시설취소'], related: ['reservationStatus', 'reserve', 'facilityHours'], mode: 'direct' },
  { id: 'facilityInfo', label: '시설안내', prompt: '공용시설 안내', aliases: ['시설정보', '시설안내', '공용시설'], related: ['reserve', 'facilityHours', 'gym'], mode: 'agent' },
  { id: 'gym', label: '헬스장', prompt: '헬스장 이용 안내', aliases: ['운동', '피트니스'], related: ['facilityInfo', 'reserve', 'facilityHours'], mode: 'agent' },
  { id: 'laundry', label: '세탁실', prompt: '세탁실 이용 안내', aliases: ['빨래', '세탁'], related: ['facilityInfo', 'facilityHours', 'reserve'], mode: 'agent' },
  { id: 'lounge', label: '라운지', prompt: '라운지 이용 안내', aliases: ['공용라운지', '휴게실'], related: ['facilityInfo', 'facilityHours', 'reserve'], mode: 'agent' },
  { id: 'studyRoom', label: '스터디룸', prompt: '스터디룸 이용 안내', aliases: ['공부방', '스터디'], related: ['reserve', 'facilityHours', 'facilityInfo'], mode: 'agent' },
  { id: 'reservationStatus', label: '예약내역', prompt: '예약 내역 확인', aliases: ['예약현황', '내예약', '예약목록'], related: ['facilityCancel', 'reserve', 'facilityHours'], mode: 'direct' },
  { id: 'availableRooms', label: '빈방', prompt: '현재 빈방 안내', aliases: ['공실', '입주가능방', '남은방'], related: ['roomRecommend', 'deposit', 'monthlyRent'], mode: 'agent' },
  { id: 'moveIn', label: '입주', prompt: '입주 절차 안내', aliases: ['입주절차', '체크인'], related: ['contract', 'deposit', 'tour'], mode: 'agent' },
  { id: 'moveOut', label: '퇴실', prompt: '퇴실 절차 안내', aliases: ['퇴거', '체크아웃'], related: ['contract', 'rules', 'contact'], mode: 'agent' },
  { id: 'deposit', label: '보증금', prompt: '보증금 안내', aliases: ['디파짓', '계약금'], related: ['monthlyRent', 'contract', 'roomRecommend'], mode: 'agent' },
  { id: 'monthlyRent', label: '월세', prompt: '월세 안내', aliases: ['임대료', '관리비'], related: ['deposit', 'roomRecommend', 'availableRooms'], mode: 'agent' },
  { id: 'wishlist', label: '찜', prompt: '찜한 방 확인', aliases: ['위시리스트', '좋아요'], related: ['roomRecommend', 'availableRooms', 'reviews'], mode: 'agent' },
  { id: 'contract', label: '계약', prompt: '계약 관련 안내', aliases: ['전자계약', '계약서'], related: ['deposit', 'moveIn', 'moveOut'], mode: 'agent' },
  { id: 'tour', label: '투어', prompt: '투어 신청 안내', aliases: ['방보러가기', '방투어'], related: ['roomRecommend', 'availableRooms', 'moveIn'], mode: 'agent' },
  { id: 'reviews', label: '후기', prompt: '후기 요약 안내', aliases: ['리뷰', '평가'], related: ['roomRecommend', 'summary', 'facilityInfo'], mode: 'agent' },
  { id: 'roomOptions', label: '옵션', prompt: '방 옵션 안내', aliases: ['옵션정보', '가구', '가전'], related: ['roomRecommend', 'availableRooms', 'deposit'], mode: 'agent' },
  { id: 'location', label: '위치', prompt: '위치 안내', aliases: ['주소', '교통', '주변'], related: ['roomRecommend', 'tour', 'facilityInfo'], mode: 'agent' },
  { id: 'contact', label: '문의', prompt: '문의 방법 안내', aliases: ['연락', '문의하기', '상담'], related: ['contract', 'moveIn', 'moveOut'], mode: 'agent' },
  { id: 'rules', label: '규정', prompt: '이용 규정 안내', aliases: ['정책', '규칙', '유의사항'], related: ['facilityInfo', 'moveOut', 'contract'], mode: 'agent' },
];

export const STARTER_ACTION_IDS = ['reserve', 'summary', 'roomRecommend'];
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
