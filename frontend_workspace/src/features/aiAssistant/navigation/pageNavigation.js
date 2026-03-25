const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

const NAVIGATION_TOKENS = [
  '이동',
  '가줘',
  '가고싶',
  '가고싶어',
  '들어가',
  '열어',
  '보여줘',
  '페이지',
  '화면',
  '목록',
  '바로가기',
  '안내',
];

const PAGE_NAVIGATIONS = [
  {
    id: 'home',
    label: '홈',
    path: '/',
    message: '홈으로 이동했습니다. 주요 메뉴와 서비스 안내를 확인할 수 있습니다.',
    aliases: ['홈', '메인', '메인페이지', '첫화면', '홈화면'],
    actionIds: ['summary', 'roomRecommend', 'notices'],
  },
  {
    id: 'about',
    label: '서비스 소개',
    path: '/about',
    message: '서비스 소개 페이지로 이동했습니다. 우리집 서비스 소개와 이용 안내를 확인할 수 있습니다.',
    aliases: ['소개', '서비스소개', '소개페이지', 'about'],
    actionIds: ['summary', 'roomRecommend', 'notices'],
  },
  {
    id: 'login',
    label: '로그인',
    path: '/login',
    message: '로그인 페이지로 이동했습니다. 이메일 로그인이나 소셜 로그인을 진행할 수 있습니다.',
    aliases: ['로그인', '로그인페이지', '로그인화면'],
    actionIds: ['signup'],
  },
  {
    id: 'signup',
    label: '회원가입',
    path: '/signup',
    message: '회원가입 페이지로 이동했습니다. 계정 정보와 본인 확인을 진행할 수 있습니다.',
    aliases: ['회원가입', '가입', '가입페이지', '회원가입페이지'],
    actionIds: ['login'],
  },
  {
    id: 'find-id',
    label: '아이디 찾기',
    path: '/find-id',
    message: '아이디 찾기 페이지로 이동했습니다. 이름과 휴대폰 확인으로 아이디를 찾을 수 있습니다.',
    aliases: ['아이디찾기', '아이디찾아줘', '이메일아이디찾기', '아이디찾기페이지'],
    actionIds: ['login'],
  },
  {
    id: 'find-password',
    label: '비밀번호 찾기',
    path: '/find-password',
    message: '비밀번호 찾기 페이지로 이동했습니다. 이름, 아이디, 휴대폰 확인 후 새 비밀번호를 설정할 수 있습니다.',
    aliases: ['비밀번호찾기', '비밀번호재설정', '비번찾기', '비밀번호찾기페이지'],
    actionIds: ['login'],
  },
  {
    id: 'convenience',
    label: '편의기능',
    path: '/convenience',
    message: '편의기능 페이지로 이동했습니다. 서비스 이용을 돕는 기능들을 확인할 수 있습니다.',
    aliases: ['편의기능', '편의기능페이지', '접근성', '접근성페이지'],
    actionIds: ['summary'],
  },
  {
    id: 'rooms',
    label: '방찾기',
    path: '/rooms',
    message: '방찾기 페이지로 이동했습니다. 원하는 지역과 예산, 방 종류를 알려주시면 더 잘 찾아드릴게요.',
    aliases: ['방찾기', '방목록', '매물목록', '방검색', '검색페이지'],
    actionIds: ['roomRecommend', 'summary'],
  },
  {
    id: 'room-detail-current',
    label: '현재 방 상세',
    getPath: ({ roomNo }) => (roomNo ? `/rooms/${roomNo}` : null),
    message: '현재 방 상세페이지로 이동했습니다. 사진, 가격, 후기와 투어 정보를 확인할 수 있습니다.',
    unavailableMessage:
      '방 상세페이지는 현재 보고 있는 방이 있을 때 바로 이동할 수 있습니다. 방 목록에서 원하는 방을 먼저 열어주세요.',
    aliases: ['방상세', '방상세페이지', '상세페이지', '현재방', '이방'],
    actionIds: ['tour', 'wishlist', 'summary'],
  },
  {
    id: 'notices',
    label: '공지사항',
    path: '/notices',
    message: '공지사항 페이지로 이동했습니다. 최신 공지와 운영 안내를 확인할 수 있습니다.',
    aliases: ['공지사항', '공지', '공지페이지'],
    actionIds: ['summary', 'mypage', 'roomRecommend'],
  },
  {
    id: 'notice-detail-current',
    label: '현재 공지 상세',
    getPath: ({ postContext }) =>
      postContext?.type === 'notice' && postContext.postNo ? `/notices/${postContext.postNo}` : null,
    message: '현재 공지 상세페이지로 이동했습니다.',
    unavailableMessage:
      '공지 상세페이지는 특정 공지 글을 보고 있을 때만 바로 이동할 수 있습니다. 공지사항 목록에서 원하는 글을 먼저 열어주세요.',
    aliases: ['공지상세', '현재공지', '이공지'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'qna',
    label: 'QnA',
    path: '/qna',
    message: 'QnA 페이지로 이동했습니다. 질문글과 답변을 확인할 수 있습니다.',
    aliases: ['qna', '문의게시판', '질문게시판', '게시판'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'qna-detail-current',
    label: '현재 QnA 상세',
    getPath: ({ postContext }) =>
      postContext?.type === 'qna' && postContext.postNo ? `/qna/${postContext.postNo}` : null,
    message: '현재 QnA 상세페이지로 이동했습니다.',
    unavailableMessage:
      'QnA 상세페이지는 특정 질문 글을 보고 있을 때만 바로 이동할 수 있습니다. QnA 목록에서 원하는 글을 먼저 열어주세요.',
    aliases: ['qna상세', '문의상세', '현재문의', '이질문'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'information',
    label: '정보게시판',
    path: '/information',
    message: '정보 게시판으로 이동했습니다. 정책, 신청 절차, 생활 정보를 확인할 수 있습니다.',
    aliases: ['정보게시판', '정보', '생활정보', '안내글'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'information-detail-current',
    label: '현재 정보글 상세',
    getPath: ({ postContext }) =>
      postContext?.type === 'information' && postContext.postNo
        ? `/information/${postContext.postNo}`
        : null,
    message: '현재 정보글 상세페이지로 이동했습니다.',
    unavailableMessage:
      '정보글 상세페이지는 특정 글을 보고 있을 때만 바로 이동할 수 있습니다. 정보 게시판에서 원하는 글을 먼저 열어주세요.',
    aliases: ['정보상세', '정보글상세', '현재정보글', '이정보글'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'event',
    label: '이벤트',
    path: '/event',
    message: '이벤트 페이지로 이동했습니다. 진행 중인 이벤트와 혜택을 확인할 수 있습니다.',
    aliases: ['이벤트', '이벤트페이지', '행사'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'event-detail-current',
    label: '현재 이벤트 상세',
    getPath: ({ postContext }) =>
      postContext?.type === 'event' && postContext.postNo ? `/event/${postContext.postNo}` : null,
    message: '현재 이벤트 상세페이지로 이동했습니다.',
    unavailableMessage:
      '이벤트 상세페이지는 특정 이벤트 글을 보고 있을 때만 바로 이동할 수 있습니다. 이벤트 목록에서 원하는 글을 먼저 열어주세요.',
    aliases: ['이벤트상세', '현재이벤트', '이이벤트'],
    actionIds: ['summary', 'notices'],
  },
  {
    id: 'mypage',
    label: '마이페이지',
    path: '/mypage',
    message: '마이페이지로 이동했습니다. 내 정보와 개인 설정을 확인할 수 있습니다.',
    aliases: ['마이페이지', '내정보', '회원정보', '프로필'],
    actionIds: ['contract', 'wishlist', 'reservationStatus'],
  },
  {
    id: 'mypage-info',
    label: '내정보 보기',
    path: '/mypage/info',
    message: '내정보 보기 페이지로 이동했습니다. 현재 등록된 정보를 확인할 수 있습니다.',
    aliases: ['내정보보기', '내정보확인', '회원정보보기', '프로필보기'],
    actionIds: ['summary', 'contract', 'wishlist'],
  },
  {
    id: 'mypage-edit',
    label: '내정보 수정',
    path: '/mypage/edit',
    message: '내정보 수정 페이지로 이동했습니다. 변경할 항목과 새로 바꿀 내용을 말씀해 주세요.',
    aliases: ['내정보수정', '회원정보수정', '프로필수정', '정보수정'],
    actionIds: ['mypage'],
  },
  {
    id: 'withdraw',
    label: '회원탈퇴',
    path: '/mypage/withdraw',
    message: '회원탈퇴 페이지로 이동했습니다. 탈퇴 전 안내사항을 확인해 주세요.',
    aliases: ['회원탈퇴', '탈퇴', '탈퇴페이지'],
    actionIds: ['mypage'],
  },
  {
    id: 'wishlist',
    label: '찜목록',
    path: '/wishlist',
    message: '찜 목록 페이지로 이동했습니다. 저장해둔 방을 확인할 수 있습니다.',
    aliases: ['찜목록', '위시리스트', '찜한방', '찜페이지'],
    actionIds: ['roomRecommend', 'tour', 'contract'],
  },
  {
    id: 'tour-list',
    label: '투어내역',
    path: '/mypage/tour',
    message: '투어 페이지로 이동했습니다. 투어 신청과 진행 내역을 확인할 수 있습니다.',
    aliases: ['투어페이지', '투어내역', '투어목록'],
    actionIds: ['tour', 'roomRecommend', 'wishlist'],
  },
  {
    id: 'tour-apply-current',
    label: '현재 방 투어신청',
    getPath: ({ roomNo }) => (roomNo ? `/rooms/${roomNo}/tour` : null),
    message: '현재 방의 투어 신청 페이지로 이동했습니다. 방문 날짜와 시간을 선택해 주세요.',
    unavailableMessage:
      '투어 신청 페이지는 현재 보고 있는 방이 있을 때 바로 이동할 수 있습니다. 방 상세페이지에서 다시 말씀해 주세요.',
    aliases: ['투어신청', '투어예약', '방보러', '방문예약'],
    actionIds: ['tour'],
  },
  {
    id: 'contract-list',
    label: '계약내역',
    path: '/mypage/contracts',
    message: '계약 페이지로 이동했습니다. 계약 진행 상태와 계약 내역을 확인할 수 있습니다.',
    aliases: ['계약페이지', '계약내역', '계약목록', '전자계약'],
    actionIds: ['contract', 'tour', 'wishlist'],
  },
  {
    id: 'contract-apply-current',
    label: '현재 방 계약신청',
    getPath: ({ roomNo }) => (roomNo ? `/rooms/${roomNo}/contract` : null),
    message: '현재 방의 계약 신청 페이지로 이동했습니다.',
    unavailableMessage:
      '계약 신청 페이지는 현재 보고 있는 방이 있을 때 바로 이동할 수 있습니다. 방 상세페이지에서 다시 말씀해 주세요.',
    aliases: ['계약신청', '입주신청', '계약하러가', '계약진행'],
    actionIds: ['contract'],
  },
  {
    id: 'facility-view',
    label: '공용시설',
    path: '/facility/view',
    message: '공용시설 페이지로 이동했습니다. 시설 안내와 예약 정보를 확인할 수 있습니다.',
    aliases: ['공용시설', '시설페이지', '시설안내', '시설목록'],
    actionIds: ['facilityHours', 'reserve', 'reservationStatus'],
  },
  {
    id: 'reservation-view',
    label: '예약내역',
    path: '/reservation/view',
    message: '예약 페이지로 이동했습니다. 현재 예약 상태를 확인하거나 예약을 진행할 수 있습니다.',
    aliases: ['예약내역', '예약페이지', '예약확인', '예약목록'],
    actionIds: ['reserve', 'facilityCancel', 'facilityHours'],
  },
  {
    id: 'estate-manage',
    label: '매물관리',
    path: '/estate/manage',
    message: '매물 관리 페이지로 이동했습니다. 등록된 건물과 방을 관리할 수 있습니다.',
    aliases: ['매물관리', '부동산관리', '방관리', '건물관리'],
    actionIds: ['roomRegister'],
  },
  {
    id: 'estate-modify',
    label: '매물수정',
    path: '/estate/modify',
    message: '매물 수정 페이지로 이동했습니다. 건물과 방 정보를 수정할 수 있습니다.',
    aliases: ['매물수정', '방수정', '건물수정'],
    actionIds: ['roomRegister'],
  },
  {
    id: 'house-register',
    label: '건물등록',
    path: '/estate/houses/new',
    message: '건물 등록 페이지로 이동했습니다. 새로운 건물 정보를 등록할 수 있습니다.',
    aliases: ['건물등록', '하우스등록', '건물추가'],
    actionIds: ['roomRegister'],
  },
  {
    id: 'house-select',
    label: '건물선택',
    path: '/estate/houses/select',
    message: '건물 선택 페이지로 이동했습니다. 방을 등록할 건물을 고를 수 있습니다.',
    aliases: ['건물선택', '하우스선택', '등록할건물선택'],
    actionIds: ['roomRegister'],
  },
  {
    id: 'room-register-current-house',
    label: '현재 건물 방등록',
    getPath: ({ currentHouseNo }) =>
      currentHouseNo ? `/estate/houses/${currentHouseNo}/rooms/new` : null,
    message: '현재 건물의 방 등록 페이지로 이동했습니다.',
    unavailableMessage:
      '방 등록 페이지는 현재 선택된 건물이 있을 때 바로 이동할 수 있습니다. 먼저 건물을 선택해 주세요.',
    aliases: ['방등록페이지', '새방등록', '방등록', '매물등록'],
    actionIds: ['roomRegister'],
  },
  {
    id: 'estate-delete',
    label: '매물삭제',
    path: '/estate/delete',
    message: '매물 삭제 페이지로 이동했습니다. 삭제 전 안내사항을 확인해 주세요.',
    aliases: ['매물삭제', '방삭제', '건물삭제'],
    actionIds: ['roomRegister'],
  },
  {
    id: 'admin-users',
    label: '회원관리',
    path: '/mypage/users',
    message: '회원 관리 페이지로 이동했습니다.',
    aliases: ['회원관리', '사용자관리', '유저관리'],
    actionIds: ['mypage'],
  },
  {
    id: 'admin-category',
    label: '시설카테고리관리',
    path: '/admin/category',
    message: '시설 카테고리 관리 페이지로 이동했습니다.',
    aliases: ['카테고리관리', '시설카테고리', '시설분류관리'],
    actionIds: ['facilityHours'],
  },
];

export const PAGE_NAVIGATION_TARGETS = PAGE_NAVIGATIONS.map((entry) => ({
  id: entry.id,
  label: entry.label,
  path: typeof entry.path === 'string' ? entry.path : '',
  aliases: Array.isArray(entry.aliases) ? entry.aliases.slice(0, 8) : [],
}));

const hasNavigationIntent = (normalizedText) =>
  NAVIGATION_TOKENS.some((token) => normalizedText.includes(normalize(token)));

const scoreEntry = (normalizedText, entry) => {
  const aliases = (entry.aliases || []).map(normalize).filter(Boolean);
  let score = 0;
  for (const alias of aliases) {
    if (normalizedText === alias) {
      score = Math.max(score, alias.length + 1000);
      continue;
    }
    if (normalizedText.includes(alias)) {
      score = Math.max(score, alias.length);
    }
  }
  return score;
};

export const getCurrentPageNavigationContext = (pathname, roomContext = {}) => {
  const currentPath = String(pathname || '');
  const houseMatch = currentPath.match(/^\/houses\/([^/]+)$/);
  const currentHouseMatch = currentPath.match(/^\/estate\/houses\/([^/]+)\/rooms\/new$/);
  const facilityMatch = currentPath.match(/^\/facility\/view\/([^/]+)?\/?([^/]+)?$/);
  const reservationMatch = currentPath.match(/^\/reservation\/view\/([^/]+)?\/?([^/]+)?$/);
  const postMatchers = [
    { type: 'notice', pattern: /^\/notices\/(\d+)$/ },
    { type: 'qna', pattern: /^\/qna\/(\d+)$/ },
    { type: 'information', pattern: /^\/information\/(\d+)$/ },
    { type: 'event', pattern: /^\/event\/(\d+)$/ },
  ];
  const postContext =
    postMatchers
      .map(({ type, pattern }) => {
        const match = currentPath.match(pattern);
        return match?.[1] ? { type, postNo: Number(match[1]) } : null;
      })
      .find(Boolean) || null;

  return {
    pathname: currentPath,
    roomNo: roomContext?.roomNo || '',
    roomName: roomContext?.roomName || '',
    houseNo: houseMatch?.[1] || '',
    currentHouseNo: currentHouseMatch?.[1] || '',
    facilityNo: facilityMatch?.[2] || '',
    reservationNo: reservationMatch?.[2] || '',
    postContext,
  };
};

export const resolvePageNavigation = (messageText, context = {}) => {
  const normalizedText = normalize(messageText);
  if (!normalizedText) return null;

  const candidates = PAGE_NAVIGATIONS.map((entry) => ({
    entry,
    score: scoreEntry(normalizedText, entry),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return null;
  }

  const best = candidates[0];
  const requiresIntent = best.score < 1000;
  if (requiresIntent && !hasNavigationIntent(normalizedText)) {
    return null;
  }

  const path =
    typeof best.entry.getPath === 'function' ? best.entry.getPath(context) : best.entry.path;

  if (!path) {
    return {
      type: 'unavailable',
      id: best.entry.id,
      message:
        best.entry.unavailableMessage ||
        '지금은 해당 페이지로 바로 이동할 수 있는 정보가 부족합니다.',
      actionIds: best.entry.actionIds || [],
    };
  }

  return {
    type: 'navigate',
    id: best.entry.id,
    path,
    message: best.entry.message,
    actionIds: best.entry.actionIds || [],
  };
};
