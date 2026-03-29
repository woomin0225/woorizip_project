export const ACTIONS = [
  {
    id: 'roomRecommend',
    label: '방 찾기',
    prompt: '방 찾기',
    aliases: ['방추천', '방추천해줘', '방찾기', '추천방', '인기방', '인기있는방보기'],
    related: ['facilityMenu', 'summary'],
    mode: 'direct',
    roles: ['user'],
  },
  {
    id: 'roomRegister',
    label: '방 등록',
    prompt: '방 등록해줘',
    aliases: ['방등록', '매물등록', '등록하기'],
    related: ['facilityMenu', 'summary'],
    mode: 'direct',
    roles: ['lessor'],
  },
  {
    id: 'facilityMenu',
    label: '공용시설',
    prompt: '공용시설 메뉴',
    aliases: ['공용시설', '시설', '공용시설메뉴', '시설메뉴'],
    related: ['reserve', 'reservationStatus', 'facilityCancel'],
    mode: 'direct',
    roles: ['user', 'lessor'],
  },
  {
    id: 'reserve',
    label: '예약',
    prompt: '공용시설 예약',
    aliases: ['시설예약', '공용시설예약', '예약하기'],
    related: ['facilityHours', 'reservationStatus', 'facilityCancel'],
    mode: 'direct',
    roles: ['user'],
  },
  {
    id: 'summary',
    label: '요약',
    prompt: '현재 페이지 요약',
    aliases: ['페이지요약', '내용요약', '설명요약'],
    related: ['roomRecommend', 'facilityMenu'],
    mode: 'direct',
    roles: ['user', 'lessor'],
  },
  {
    id: 'facilityHours',
    label: '이용시간',
    prompt: '공용시설 이용시간',
    aliases: ['운영시간', '몇시까지', '시설시간'],
    related: ['reserve', 'reservationStatus', 'facilityCancel'],
    mode: 'direct',
    roles: ['user'],
  },
  {
    id: 'facilityCancel',
    label: '예약취소',
    prompt: '공용시설 예약 취소',
    aliases: ['취소', '예약취소', '시설취소'],
    related: ['reservationStatus', 'reserve', 'facilityHours'],
    mode: 'direct',
    roles: ['user'],
  },
  {
    id: 'reservationStatus',
    label: '예약내역',
    prompt: '예약 내역 확인',
    aliases: ['예약현황', '내예약', '예약목록'],
    related: ['facilityCancel', 'reserve', 'facilityHours'],
    mode: 'direct',
    roles: ['user'],
  },
  {
    id: 'userManage',
    label: '유저관리',
    prompt: '유저 관리 페이지 이동',
    aliases: ['유저관리', '사용자관리', '회원관리'],
    related: [],
    mode: 'direct',
    roles: ['admin'],
  },
];

export const ROLE_STARTER_ACTION_IDS = {
  user: ['roomRecommend', 'facilityMenu', 'summary'],
  lessor: ['roomRegister', 'facilityMenu', 'summary'],
  admin: ['userManage'],
};

export const VOICE_CONFIRM_ACTIONS = new Set(['reserve']);

const YES_TOKENS = ['예', '네', '응', '맞아', '좋아', '확인', '진행'];
const NO_TOKENS = ['아니오', '아니', '취소', '중지', '그만', '싫어'];

export const ACTION_MAP = ACTIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

export const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');

const normalizeRole = (role) => {
  if (role === 'admin' || role === 'lessor' || role === 'user') return role;
  return 'user';
};

const getActionTokens = (action) =>
  [action.label, action.prompt, ...(action.aliases || [])]
    .map(normalizeText)
    .filter(Boolean);

const getDirectTriggerTokens = (action) =>
  [action.label, ...(action.aliases || [])].map(normalizeText).filter(Boolean);

export const isActionAvailableForRole = (actionId, role = 'user') => {
  const action = ACTION_MAP[actionId];
  if (!action) return false;
  const allowedRoles = Array.isArray(action.roles) ? action.roles : ['user'];
  return allowedRoles.includes(normalizeRole(role));
};

export const filterActionIdsForRole = (ids = [], role = 'user') => {
  const seen = new Set();
  return ids.filter((id) => {
    if (!isActionAvailableForRole(id, role) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const getStarterActionIds = (role = 'user') =>
  filterActionIdsForRole(ROLE_STARTER_ACTION_IDS[normalizeRole(role)] || [], role);

const getRoleActions = (role = 'user') =>
  ACTIONS.filter((action) => isActionAvailableForRole(action.id, role));

export const uniqActionIds = (ids, role = 'user') =>
  filterActionIdsForRole(ids, role);

export const matchActionIds = (value, options = {}) => {
  const text = normalizeText(value);
  if (!text) return [];

  return getRoleActions(options.role).map((action) => {
    if (options.directOnly && action.mode !== 'direct') {
      return { id: action.id, score: 0 };
    }

    const score = getActionTokens(action).reduce((max, token) => {
      if (!token || !text.includes(token)) return max;
      return Math.max(max, token.length);
    }, 0);

    return { id: action.id, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id);
};

export const detectQuickAction = (value, options = {}) => {
  const text = normalizeText(value);
  if (!text) return null;

  return (
    getRoleActions(options.role).find((action) =>
      getDirectTriggerTokens(action).some((token) => token === text)
    )?.id || null
  );
};

export const suggestActionsFromText = (value, options = {}) =>
  matchActionIds(value, options);

export const expandRelatedActionIds = (ids, limit = 3, options = {}) => {
  const role = normalizeRole(options.role);
  const selected = uniqActionIds(ids, role);
  const result = [...selected];

  for (let i = 0; i < selected.length && result.length < limit; i += 1) {
    const current = ACTION_MAP[selected[i]];
    (current?.related || []).forEach((relatedId) => {
      if (
        result.length < limit &&
        isActionAvailableForRole(relatedId, role) &&
        !result.includes(relatedId)
      ) {
        result.push(relatedId);
      }
    });
  }

  return result.slice(0, limit);
};

export const isYes = (value) =>
  YES_TOKENS.some((token) => normalizeText(value).includes(normalizeText(token)));

export const isNo = (value) =>
  NO_TOKENS.some((token) => normalizeText(value).includes(normalizeText(token)));
