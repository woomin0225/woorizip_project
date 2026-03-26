import { isNo, normalizeText } from './aiAssistantQuickAgentActions';

const DEFAULT_ROOM_RECOMMENDATION_COND = {
  keyword: '', roomType: 'L', minDeposit: null, maxDeposit: null, minTax: null, maxTax: null,
  swLat: 37.4531, swLng: 126.8446, neLat: 37.7201, neLng: 127.2244,
  houseOptions: [], roomOptions: [], roomRoomCount: null, houseElevatorYn: false,
  housePetYn: false, houseFemaleLimit: false, houseParking: true, criterion: 'LATEST',
};
const ROOM_SEARCH_PAGE_TRIGGER_PATTERNS = ['방검색', '방 찾기', '방찾기', '방찾고싶어', '방찾고싶', '방보고싶어', '방보고싶', '방보여줘', '방목록', '방 리스트'];
const ROOM_RECOMMENDATION_TRIGGER_PATTERNS = ['방추천', '추천해줘', '추천해주세요', '추천부탁', '추천받고싶', '추천받고싶어', '추천좀', '추천해줄래', '추천받을래', '추천받아보고싶'];
const ROOM_PREFERENCE_HINT_PATTERNS = ['저렴한방', '싼방', '가성비방', '넓은방', '큰방', '넓은집', '큰집', '작은방', '좁은방', '작은집', '원룸추천', '투룸추천', '1인실추천', '2인실추천', '역세권방', '주차가능한방', '엘리베이터있는방', '반려동물가능한방', '여성전용방'];
const ROOM_DETAIL_TRIGGER_PATTERNS = ['그방', '이방', '추천해준방', '자세히', '상세', '들어가줘', '들어가고싶', '보고싶', '보여줘', '열어줘', '확인하고싶'];
const includesAny = (text, patterns) => patterns.some((pattern) => text.includes(normalizeText(pattern)));

export const isRoomsSearchPage = (pathname) => pathname === '/rooms';
export const isRoomSearchPageRequest = (normalized) => Boolean(normalized) && includesAny(normalized, ROOM_SEARCH_PAGE_TRIGGER_PATTERNS);
export const isRoomRecommendationRequest = (normalized) => Boolean(normalized) && includesAny(normalized, ROOM_RECOMMENDATION_TRIGGER_PATTERNS);
export const isRoomPreferenceRequest = (normalized) => Boolean(normalized) && (normalized.includes('방') || normalized.includes('집') || normalized.includes('룸')) && includesAny(normalized, ROOM_PREFERENCE_HINT_PATTERNS);
const isRoomDetailRequest = (normalized) => Boolean(normalized) && includesAny(normalized, ROOM_DETAIL_TRIGGER_PATTERNS);
export const isTourApplyIntent = (normalized) =>
  Boolean(normalized) &&
  (normalized.includes('투어신청') || normalized.includes('투어예약') || normalized.includes('방보러가') ||
    (normalized.includes('투어') && (normalized.includes('신청') || normalized.includes('예약') || normalized.includes('하고싶') || normalized.includes('원해'))));

const parseAmountToWon = (text) => {
  if (!text) return null;
  const amountMatch = String(text).match(/(\d+(?:\.\d+)?)\s*(억|천만|백만|십만|만원|만|원)?/);
  if (!amountMatch) return null;
  const value = Number(amountMatch[1]);
  if (Number.isNaN(value)) return null;
  const unit = amountMatch[2] || '만';
  if (unit === '억') return Math.round(value * 100000000);
  if (unit === '천만') return Math.round(value * 10000000);
  if (unit === '백만') return Math.round(value * 1000000);
  if (unit === '십만') return Math.round(value * 100000);
  if (unit === '원') return Math.round(value);
  return Math.round(value * 10000);
};
const extractBudgetRange = (text, label) => {
  const source = String(text || '');
  const maxMatch = source.match(new RegExp(`${label}\\s*([\\d.,]+\\s*(?:억|천만|백만|십만|만원|만|원)?)(?:\\s*(?:이하|까지|안쪽|미만))?`));
  const minMatch = source.match(new RegExp(`${label}\\s*([\\d.,]+\\s*(?:억|천만|백만|십만|만원|만|원)?)\\s*(?:이상|부터|초과|넘는)`));
  return { min: minMatch ? parseAmountToWon(minMatch[1]) : null, max: maxMatch ? parseAmountToWon(maxMatch[1]) : null };
};
const extractLocationKeyword = (messageText) => String(messageText || '').match(/([가-힣0-9]{2,}(?:역|구|동|로|가))(?:근처|부근|쪽|인근)?/)?.[1] || '';

export const buildRoomRecommendationRequest = (messageText) => {
  const text = String(messageText || '');
  const normalized = normalizeText(text);
  const cond = { ...DEFAULT_ROOM_RECOMMENDATION_COND };
  const preference = { sortBy: 'LATEST', roomLabel: '' };
  const hasExplicitRoomType = normalized.includes('월세') || normalized.includes('전세');
  if (normalized.includes('월세')) cond.roomType = 'M';
  if (normalized.includes('전세')) cond.roomType = 'L';
  if (!hasExplicitRoomType && includesAny(normalized, ['저렴한방', '싼방', '가성비'])) cond.roomType = 'M';
  const depositRange = extractBudgetRange(text, '보증금');
  if (depositRange.min !== null) cond.minDeposit = depositRange.min;
  if (depositRange.max !== null) cond.maxDeposit = depositRange.max;
  const taxRange = extractBudgetRange(text, '월세');
  if (taxRange.min !== null) cond.minTax = taxRange.min;
  if (taxRange.max !== null) cond.maxTax = taxRange.max;
  if (normalized.includes('1인') || normalized.includes('혼자') || normalized.includes('원룸') || normalized.includes('1인실')) {
    cond.roomRoomCount = 1; preference.roomLabel = '1인용';
  }
  if (normalized.includes('2인') || normalized.includes('둘이') || normalized.includes('2인실') || normalized.includes('투룸')) {
    cond.roomRoomCount = 2; preference.roomLabel = '2인용';
  }
  if (normalized.includes('여성전용')) cond.houseFemaleLimit = true;
  if (normalized.includes('반려동물') || normalized.includes('애완동물')) cond.housePetYn = true;
  if (normalized.includes('엘리베이터')) cond.houseElevatorYn = true;
  if (normalized.includes('주차')) cond.houseParking = true;
  if (includesAny(normalized, ['저렴한방', '싼방', '가성비'])) preference.sortBy = 'LOW_COST';
  if (includesAny(normalized, ['비싼방', '고급방'])) preference.sortBy = 'HIGH_COST';
  if (includesAny(normalized, ['넓은방', '큰방', '넓은집', '큰집'])) preference.sortBy = 'LARGE_AREA';
  if (includesAny(normalized, ['작은방', '좁은방', '작은집'])) preference.sortBy = 'SMALL_AREA';
  const keyword = extractLocationKeyword(text);
  if (keyword) cond.keyword = keyword;
  if (normalized.includes('역세권') && !cond.keyword) preference.roomLabel = preference.roomLabel ? `${preference.roomLabel} 역세권` : '역세권';
  return { cond, preference };
};

export const hasRoomPreference = ({ cond, preference }) =>
  Boolean(cond.keyword || cond.roomType === 'M' || cond.minDeposit !== null || cond.maxDeposit !== null || cond.minTax !== null || cond.maxTax !== null || cond.roomRoomCount || cond.houseFemaleLimit || cond.housePetYn || cond.houseElevatorYn || preference.sortBy !== 'LATEST');

const formatMoneyKR = (value) => {
  const amount = Number(value || 0);
  if (!amount) return '0원';
  const eok = Math.floor(amount / 100000000);
  const man = Math.round((amount % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man}만 원`;
  if (eok > 0) return `${eok}억 원`;
  return `${man}만 원`;
};
const formatRoomPrice = (room) => {
  const deposit = Number(room?.roomDeposit || 0);
  const monthly = Number(room?.roomMonthly || 0);
  if (room?.roomMethod === 'M') return `보증금 ${formatMoneyKR(deposit)} / 월세 ${formatMoneyKR(monthly)}`;
  return `전세 ${formatMoneyKR(deposit)}`;
};
const getRoomCostScore = (room) => Number(room?.roomDeposit || 0) + Number(room?.roomMonthly || 0) * 24;
export const sortRecommendedRooms = (rooms, preference) => {
  const copied = [...rooms];
  if (preference.sortBy === 'LOW_COST') return copied.sort((a, b) => getRoomCostScore(a) - getRoomCostScore(b));
  if (preference.sortBy === 'HIGH_COST') return copied.sort((a, b) => getRoomCostScore(b) - getRoomCostScore(a));
  if (preference.sortBy === 'LARGE_AREA') return copied.sort((a, b) => Number(b?.roomArea || 0) - Number(a?.roomArea || 0));
  if (preference.sortBy === 'SMALL_AREA') return copied.sort((a, b) => Number(a?.roomArea || 0) - Number(b?.roomArea || 0));
  return copied;
};
export const formatRecommendedRoomsMessage = (rooms) =>
  rooms.map((room, index) => [
    `${index + 1}. ${room.roomName || '이름 없는 방'}`,
    room.houseName ? `건물: ${room.houseName}` : '',
    formatRoomPrice(room),
    room.roomArea ? `면적: ${room.roomArea}㎡` : '',
    room.houseAddress ? `위치: ${room.houseAddress}` : '',
  ].filter(Boolean).join(' / ')).join('\n');
export const pickRecommendedRoom = (messageText, rooms) => {
  if (!Array.isArray(rooms) || rooms.length === 0) return null;
  const normalized = normalizeText(messageText);
  const indexMatch = normalized.match(/(\d+)\s*번(?:방)?/);
  const selectedIndex = indexMatch ? Number(indexMatch[1]) - 1 : null;
  if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < rooms.length) {
    return rooms[selectedIndex] || null;
  }
  const matchedByName = rooms.find((room) => {
    const roomName = normalizeText(room?.roomName || '');
    const houseName = normalizeText(room?.houseName || '');
    return (roomName && normalized.includes(roomName)) || (houseName && normalized.includes(houseName));
  });
  if (matchedByName) return matchedByName;
  if (!isRoomDetailRequest(normalized)) return null;
  if (normalized.includes('2번') || normalized.includes('두번째') || normalized.includes('두번')) return rooms[1] || null;
  if (normalized.includes('3번') || normalized.includes('세번째') || normalized.includes('세번')) return rooms[2] || null;
  if (normalized.includes('1번') || normalized.includes('첫번째') || normalized.includes('첫방') || normalized.includes('그방') || normalized.includes('이방')) return rooms[0] || null;
  return rooms[0] || null;
};
export const shouldCancelRoomRecommendation = (messageText) => isNo(messageText);
