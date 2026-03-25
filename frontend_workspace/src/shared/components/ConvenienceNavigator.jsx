import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { searchRooms } from '../../features/houseAndRoom/api/roomApi';
import { getTourPage } from '../../features/tour/api/tourAPI';
import {
  getFacilityDetail,
  getFacilityList,
} from '../../features/facility/api/facilityApi';
import { useAuth } from '../../app/providers/AuthProvider';
import styles from './ConvenienceNavigator.module.css';

const DEFAULT_ROOM_COND = {
  keyword: '',
  roomType: 'L',
  minDeposit: null,
  maxDeposit: null,
  minTax: null,
  maxTax: null,
  swLat: 37.4531,
  swLng: 126.8446,
  neLat: 37.5973,
  neLng: 127.1505,
  options: '',
  roomRoomCount: null,
  houseElevatorYn: false,
  housePetYn: false,
  houseFemaleLimit: false,
  houseParking: false,
  criterion: 'LATEST',
};

const ROOM_FEATURE_OPTIONS = [
  { id: 'houseParking', label: '주차 가능' },
  { id: 'houseElevatorYn', label: '엘리베이터' },
  { id: 'housePetYn', label: '반려동물 가능' },
  { id: 'houseFemaleLimit', label: '여성전용' },
];

const JEONSE_BUDGET_OPTIONS = [
  {
    id: 'jeonse-under-50m',
    label: '5천만 원 이하',
    min: null,
    max: 50_000_000,
  },
  {
    id: 'jeonse-50m-100m',
    label: '5천만 원 ~ 1억 원',
    min: 50_000_000,
    max: 100_000_000,
  },
  {
    id: 'jeonse-100m-200m',
    label: '1억 원 ~ 2억 원',
    min: 100_000_000,
    max: 200_000_000,
  },
  { id: 'jeonse-over-200m', label: '2억 원 이상', min: 200_000_000, max: null },
];

const WOLSE_DEPOSIT_OPTIONS = [
  { id: 'monthly-under-5m', label: '500만 원 이하', min: null, max: 5_000_000 },
  {
    id: 'monthly-5m-10m',
    label: '500만 원 ~ 1천만 원',
    min: 5_000_000,
    max: 10_000_000,
  },
  {
    id: 'monthly-10m-30m',
    label: '1천만 원 ~ 3천만 원',
    min: 10_000_000,
    max: 30_000_000,
  },
  {
    id: 'monthly-over-30m',
    label: '3천만 원 이상',
    min: 30_000_000,
    max: null,
  },
];

const WOLSE_MONTHLY_OPTIONS = [
  { id: 'rent-under-40', label: '40만 원 이하', min: null, max: 400_000 },
  { id: 'rent-40-60', label: '40만 원 ~ 60만 원', min: 400_000, max: 600_000 },
  {
    id: 'rent-60-100',
    label: '60만 원 ~ 100만 원',
    min: 600_000,
    max: 1_000_000,
  },
  { id: 'rent-over-100', label: '100만 원 이상', min: 1_000_000, max: null },
];

function createInitialRoomFinder() {
  return {
    roomType: 'L',
    roomRoomCount: 1,
    keyword: '',
    houseParking: false,
    houseElevatorYn: false,
    housePetYn: false,
    houseFemaleLimit: false,
    depositBudgetKey: '',
    monthlyBudgetKey: '',
  };
}

function getDepositBudgetOptions(roomType) {
  return roomType === 'L' ? JEONSE_BUDGET_OPTIONS : WOLSE_DEPOSIT_OPTIONS;
}

function findBudgetOption(options, optionId) {
  return options.find((option) => option.id === optionId) || null;
}

function formatMoneyKRW(value) {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);

  const EOK = 100_000_000;
  const MAN = 10_000;
  const eok = Math.floor(n / EOK);
  const rest = n % EOK;
  const man = Math.round(rest / MAN);

  if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
  if (eok > 0) return `${eok}억`;
  return `${Math.round(n / MAN)}만`;
}

function roomPriceText(room) {
  const deposit = formatMoneyKRW(room?.roomDeposit);
  const monthly = formatMoneyKRW(room?.roomMonthly);
  const depositText = deposit ? `${deposit} 원` : '';
  const monthlyText = monthly ? `${monthly} 원` : '';

  if (room?.roomMethod === 'M') {
    return `보증금 ${depositText}${monthlyText ? ` / 월세 ${monthlyText}` : ''}`;
  }
  if (room?.roomMethod === 'L') {
    return depositText ? `전세 ${depositText}` : '전세';
  }
  return [depositText, monthlyText].filter(Boolean).join(' / ');
}

function roomMethodLabel(method) {
  if (method === 'L') return '전세';
  if (method === 'M') return '월세';
  return '매물';
}

function occupancyLabel(roomCount) {
  const n = Number(roomCount);
  if (!n || Number.isNaN(n)) return '';
  if (n <= 1) return '1인 거주';
  if (n === 2) return '2인 거주';
  return `${n}인 이상`;
}

function tourStatusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return '승인대기';
    case 'APPROVED':
      return '승인됨';
    case 'REJECTED':
      return '취소/거절';
    default:
      return status || '-';
  }
}

function formatDate(value) {
  if (!value) return '-';
  if (typeof value === 'string') return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function canEditTour(status) {
  return ['PENDING'].includes(String(status || '').toUpperCase());
}

function canCancelTour(status) {
  return ['PENDING'].includes(String(status || '').toUpperCase());
}

function normalizeFacilityList(response) {
  const actualData = response?.data?.data || response?.data || response;
  return Array.isArray(actualData) ? actualData : [];
}

function canReserveFacility(facility) {
  const status = String(facility?.facilityStatus || '').toUpperCase();
  if (status === 'UNAVAILABLE' || status === 'DELETED') return false;
  return Boolean(facility?.facilityRsvnRequiredYn);
}

function isNotFoundError(error) {
  const status = Number(
    error?.response?.status || error?.status || error?.cause?.status || 0
  );
  if (status === 404) return true;
  return String(error?.message || '').includes('404');
}

function buildMenuGroups(isLessor) {
  const statusLabel = isLessor ? '승인 현황' : '신청 현황';
  const statusDescription = isLessor
    ? '투어와 입주 요청을 확인합니다.'
    : '투어와 입주 신청 상태를 확인합니다.';

  const groups = [
    {
      id: 'room',
      label: '매물',
      description: '방을 찾거나 관심 매물을 확인합니다.',
      question: '매물에서 무엇을 보고 싶으신가요?',
      actions: [
        {
          id: 'room-search',
          label: '매물 보기',
          description: '질문에 답하고 바로 추천 매물을 확인합니다.',
          type: 'room-finder',
        },
        {
          id: 'wishlist',
          label: '관심 매물',
          description: '저장해 둔 매물을 모아서 확인합니다.',
          to: ROUTES.WISHLIST.LIST,
        },
        {
          id: 'tour-status',
          label: statusLabel,
          description: isLessor
            ? statusDescription
            : '투어 신청, 변경, 취소를 쉽게 진행합니다.',
          ...(isLessor
            ? { to: ROUTES.TOUR.LIST }
            : { type: 'application-menu' }),
        },
      ],
    },
    {
      id: 'my-info',
      label: '내정보',
      description: '내 정보와 계약 내역을 확인합니다.',
      question: '내정보에서 무엇을 하고 싶으신가요?',
      actions: [
        {
          id: 'my-info-view',
          label: '내정보 보기',
          description: '회원 정보를 확인합니다.',
          to: ROUTES.MEMBER.MY_INFO,
        },
        {
          id: 'my-info-edit',
          label: '내정보 수정',
          description: '이름, 연락처 등 정보를 수정합니다.',
          to: ROUTES.MEMBER.MY_INFO_EDIT,
        },
        {
          id: 'contract-list',
          label: '계약 현황',
          description: '계약 진행과 완료 내역을 확인합니다.',
          to: ROUTES.CONTRACT.LIST,
        },
      ],
    },
    {
      id: 'board',
      label: '게시판보기',
      description: '공지와 정책, 이벤트 게시글을 찾습니다.',
      question: '게시판에서 무엇을 보고 싶으신가요?',
      actions: [
        {
          id: 'notice',
          label: '공지사항',
          description: '운영 공지와 중요한 안내를 확인합니다.',
          to: '/notices',
        },
        {
          id: 'event',
          label: '이벤트',
          description: '진행 중인 이벤트를 확인합니다.',
          to: '/event',
        },
        {
          id: 'information',
          label: '정책/정보',
          description: '생활 정보와 정책 글을 봅니다.',
          to: '/information',
        },
        {
          id: 'qna',
          label: 'QnA',
          description: '자주 묻는 질문과 문의 게시판으로 이동합니다.',
          to: '/qna',
        },
      ],
    },
    {
      id: 'facility',
      label: '공용시설',
      description: '공용시설과 예약 내역을 확인합니다.',
      question: '공용시설에서 무엇을 하고 싶으신가요?',
      actions: [
        {
          id: 'facility-view',
          label: '시설 보기',
          description: '예약 가능한 공용시설을 보고 바로 예약합니다.',
          type: 'facility-picker',
        },
        {
          id: 'reservation-view',
          label: '예약 확인',
          description: '공용시설 예약 내역을 확인합니다.',
          to: '/reservation/view',
        },
      ],
    },
  ];

  if (isLessor) {
    groups.push({
      id: 'estate-manage',
      label: '매물 관리',
      description: '등록한 건물과 방을 관리합니다.',
      question: '매물 관리에서 무엇을 하고 싶으신가요?',
      actions: [
        {
          id: 'estate-home',
          label: '관리 화면',
          description: '건물과 방 관리 메뉴를 한 번에 봅니다.',
          to: '/estate/manage',
        },
        {
          id: 'house-create',
          label: '건물 등록',
          description: '새 건물 정보를 등록합니다.',
          to: '/estate/houses/new',
        },
        {
          id: 'room-create',
          label: '방 등록',
          description: '등록한 건물에 방을 추가합니다.',
          to: '/estate/houses/select',
        },
        {
          id: 'estate-edit',
          label: '목록 수정',
          description: '등록한 건물과 방 정보를 수정합니다.',
          to: '/estate/modify',
        },
      ],
    });
  }

  return groups;
}

export default function ConvenienceNavigator({
  userName = '',
  isLessor = false,
  defaultOpen = false,
  hideToggle = false,
  hideHero = false,
}) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [selectedGroupId, setSelectedGroupId] = React.useState(null);
  const [selectedActionId, setSelectedActionId] = React.useState(null);
  const [roomFinder, setRoomFinder] = React.useState(createInitialRoomFinder);
  const [roomResults, setRoomResults] = React.useState([]);
  const [roomSearchError, setRoomSearchError] = React.useState('');
  const [roomSearchLoading, setRoomSearchLoading] = React.useState(false);
  const [hasRoomSearchAttempted, setHasRoomSearchAttempted] =
    React.useState(false);
  const [selectedApplicationAction, setSelectedApplicationAction] =
    React.useState('');
  const [tourActionItems, setTourActionItems] = React.useState([]);
  const [tourActionLoading, setTourActionLoading] = React.useState(false);
  const [tourActionError, setTourActionError] = React.useState('');
  const [facilityItems, setFacilityItems] = React.useState([]);
  const [facilityLoading, setFacilityLoading] = React.useState(false);
  const [facilityError, setFacilityError] = React.useState('');
  const detailStepRef = React.useRef(null);
  const moveStepRef = React.useRef(null);
  const applicationActionRef = React.useRef(null);
  const roomFinderRef = React.useRef(null);
  const roomResultsRef = React.useRef(null);
  const facilityPickerRef = React.useRef(null);
  const tourActionListRef = React.useRef(null);

  const groups = React.useMemo(() => buildMenuGroups(isLessor), [isLessor]);
  const selectedGroup = React.useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );
  const selectedAction = React.useMemo(
    () =>
      selectedGroup?.actions.find((action) => action.id === selectedActionId) ||
      null,
    [selectedActionId, selectedGroup]
  );
  const isRoomFinderAction = selectedAction?.type === 'room-finder';
  const isApplicationMenuAction = selectedAction?.type === 'application-menu';
  const isFacilityPickerAction = selectedAction?.type === 'facility-picker';
  const shouldShowRoomFinder =
    isRoomFinderAction || selectedApplicationAction === 'tour-apply';
  const depositBudgetOptions = React.useMemo(
    () => getDepositBudgetOptions(roomFinder.roomType),
    [roomFinder.roomType]
  );
  const guideVisible = hideToggle || isOpen;
  const sectionClassName = hideHero ? styles.sectionStandalone : styles.section;
  const roomFinderTitle =
    selectedApplicationAction === 'tour-apply'
      ? '투어를 신청할 매물을 골라주세요.'
      : '어떤 매물을 보고 싶으신가요?';

  const scrollToRef = React.useCallback((ref) => {
    window.setTimeout(() => {
      const element = ref?.current;
      if (!element) return;

      const startY = window.scrollY;
      const targetY = element.getBoundingClientRect().top + window.scrollY - 72;
      const distance = targetY - startY;
      const duration = 420;

      if (Math.abs(distance) < 4) return;

      const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const startTime = performance.now();

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        window.scrollTo(0, startY + distance * easedProgress);

        if (progress < 1) {
          window.requestAnimationFrame(animateScroll);
        }
      };

      window.requestAnimationFrame(animateScroll);
    }, 120);
  }, []);

  const toggleGuide = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedGroupId(null);
        setSelectedActionId(null);
        setSelectedApplicationAction('');
      }
      return next;
    });
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedActionId(null);
    setRoomResults([]);
    setRoomSearchError('');
    setHasRoomSearchAttempted(false);
    setSelectedApplicationAction('');
    setTourActionItems([]);
    setTourActionError('');
    setFacilityItems([]);
    setFacilityError('');
    scrollToRef(detailStepRef);
  };

  const handleReset = () => {
    setSelectedGroupId(null);
    setSelectedActionId(null);
    setRoomResults([]);
    setRoomSearchError('');
    setHasRoomSearchAttempted(false);
    setSelectedApplicationAction('');
    setTourActionItems([]);
    setTourActionError('');
    setFacilityItems([]);
    setFacilityError('');
  };

  const greeting = userName
    ? `${userName}님, 찾고 싶은 메뉴를 차례대로 눌러보세요.`
    : '찾고 싶은 메뉴를 차례대로 눌러보세요.';

  const handleRoomFinderChange = (name, value) => {
    setRoomFinder((prev) => {
      if (name === 'roomType') {
        return {
          ...prev,
          roomType: value,
          depositBudgetKey: '',
          monthlyBudgetKey: '',
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleRoomFeatureToggle = (name) => {
    setRoomFinder((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const runRoomFinder = async () => {
    setRoomSearchLoading(true);
    setRoomSearchError('');
    setHasRoomSearchAttempted(true);

    const depositBudget = findBudgetOption(
      depositBudgetOptions,
      roomFinder.depositBudgetKey
    );
    const monthlyBudget = findBudgetOption(
      WOLSE_MONTHLY_OPTIONS,
      roomFinder.monthlyBudgetKey
    );

    const cond = {
      ...DEFAULT_ROOM_COND,
      roomType: roomFinder.roomType,
      roomRoomCount: roomFinder.roomRoomCount,
      keyword: String(roomFinder.keyword || '').trim(),
      minDeposit: depositBudget?.min ?? null,
      maxDeposit: depositBudget?.max ?? null,
      minTax: monthlyBudget?.min ?? null,
      maxTax: monthlyBudget?.max ?? null,
      houseParking: roomFinder.houseParking,
      houseElevatorYn: roomFinder.houseElevatorYn,
      housePetYn: roomFinder.housePetYn,
      houseFemaleLimit: roomFinder.houseFemaleLimit,
    };

    if (cond.roomType === 'L') {
      cond.minTax = null;
      cond.maxTax = null;
    }

    try {
      const slice = await searchRooms(cond, 0, 4);
      setRoomResults(Array.isArray(slice?.content) ? slice.content : []);
    } catch (error) {
      setRoomResults([]);
      setRoomSearchError(
        error?.message || '매물을 불러오지 못했습니다. 다시 시도해 주세요.'
      );
    } finally {
      setRoomSearchLoading(false);
    }
  };

  const loadTourActionItems = async (mode) => {
    setTourActionLoading(true);
    setTourActionError('');

    try {
      const response = await getTourPage(1, 20);
      const items = Array.isArray(response?.content) ? response.content : [];
      const filtered = items.filter((item) =>
        mode === 'tour-edit'
          ? canEditTour(item?.status)
          : canCancelTour(item?.status)
      );
      setTourActionItems(filtered);
    } catch (error) {
      setTourActionItems([]);
      setTourActionError(
        error?.message || '신청 내역을 불러오지 못했습니다. 다시 시도해 주세요.'
      );
    } finally {
      setTourActionLoading(false);
    }
  };

  const loadFacilityItems = async () => {
    setFacilityLoading(true);
    setFacilityError('');

    try {
      const response = await getFacilityList();
      const listItems = normalizeFacilityList(response);

      const detailedItems = await Promise.all(
        listItems.map(async (facility) => {
          if (!facility?.facilityNo) return facility;

          const hasReservationInfo =
            facility.facilityRsvnRequiredYn !== undefined &&
            facility.facilityStatus !== undefined;

          if (hasReservationInfo) return facility;

          try {
            const detailResponse = await getFacilityDetail(facility.facilityNo);
            const detail = detailResponse?.data || detailResponse;
            return { ...facility, ...detail };
          } catch {
            return facility;
          }
        })
      );

      const reservableItems = detailedItems.filter(canReserveFacility);
      setFacilityItems(reservableItems);
    } catch (error) {
      setFacilityItems([]);
      if (isNotFoundError(error)) {
        setFacilityError('');
      } else {
        setFacilityError(
          error?.message ||
            '공용시설 목록을 불러오지 못했습니다. 다시 시도해 주세요.'
        );
      }
    } finally {
      setFacilityLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isFacilityPickerAction) return;
    loadFacilityItems();
  }, [isFacilityPickerAction]);

  React.useEffect(() => {
    if (isApplicationMenuAction) {
      scrollToRef(applicationActionRef);
    }
  }, [isApplicationMenuAction, scrollToRef]);

  React.useEffect(() => {
    if (selectedAction) {
      scrollToRef(moveStepRef);
    }
  }, [selectedAction, scrollToRef]);

  React.useEffect(() => {
    if (selectedApplicationAction) {
      scrollToRef(applicationActionRef);
    }
  }, [selectedApplicationAction, scrollToRef]);

  React.useEffect(() => {
    if (shouldShowRoomFinder) {
      scrollToRef(roomFinderRef);
    }
  }, [shouldShowRoomFinder, scrollToRef]);

  React.useEffect(() => {
    if (isFacilityPickerAction) {
      scrollToRef(facilityPickerRef);
    }
  }, [isFacilityPickerAction, scrollToRef]);

  React.useEffect(() => {
    if (
      (selectedApplicationAction === 'tour-edit' ||
        selectedApplicationAction === 'tour-cancel') &&
      (tourActionLoading || tourActionItems.length > 0 || tourActionError)
    ) {
      scrollToRef(tourActionListRef);
    }
  }, [
    selectedApplicationAction,
    tourActionLoading,
    tourActionItems.length,
    tourActionError,
    scrollToRef,
  ]);

  React.useEffect(() => {
    if (roomSearchLoading || roomResults.length > 0 || roomSearchError) {
      scrollToRef(roomResultsRef);
    }
  }, [roomSearchLoading, roomResults.length, roomSearchError, scrollToRef]);

  React.useEffect(() => {
    if (
      selectedApplicationAction !== 'tour-edit' &&
      selectedApplicationAction !== 'tour-cancel'
    ) {
      return;
    }

    loadTourActionItems(selectedApplicationAction);
  }, [selectedApplicationAction]);

  return (
    <section className={sectionClassName} aria-label="편의기능 안내">
      {!hideHero && (
        <div className={styles.heroCard}>
          <div className={styles.heroTextBlock}>
            <span className={styles.badge}>쉬운 메뉴 안내</span>
            <h2 className={styles.title}>{greeting}</h2>
            <p className={styles.description}>
              복잡한 메뉴를 찾지 않아도 됩니다. 큰 버튼을 순서대로 누르면 원하는
              페이지로 안내해 드립니다.
            </p>
          </div>

          {!hideToggle && (
            <div className={styles.quickActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={toggleGuide}
                aria-expanded={isOpen}
              >
                {isOpen ? '편의기능 닫기' : '편의기능 열기'}
              </button>
            </div>
          )}
        </div>
      )}

      {guideVisible && (
        <div className={styles.guideCard}>
          <div className={styles.stepRow} aria-hidden="true">
            <span className={`${styles.stepChip} ${styles.stepChipActive}`}>
              1 원하는 곳 선택
            </span>
            <span
              className={`${styles.stepChip} ${
                selectedGroup ? styles.stepChipActive : ''
              }`}
            >
              2 세부 메뉴 선택
            </span>
            <span
              className={`${styles.stepChip} ${
                selectedAction ? styles.stepChipActive : ''
              }`}
            >
              3 이동하기
            </span>
          </div>

          <div className={styles.block}>
            <p className={styles.question}>어떤 페이지를 보고 싶으신가요?</p>
            <div className={styles.optionGrid}>
              {groups.map((group) => {
                const isSelected = group.id === selectedGroupId;
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`${styles.optionButton} ${
                      isSelected ? styles.optionButtonSelected : ''
                    }`}
                    onClick={() => handleSelectGroup(group.id)}
                  >
                    <strong className={styles.optionTitle}>
                      {group.label}
                    </strong>
                    <span className={styles.optionDescription}>
                      {group.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedGroup && (
            <div
              ref={detailStepRef}
              className={`${styles.block} ${styles.scrollAnchor}`}
            >
              <div className={styles.blockHeader}>
                <p className={styles.question}>{selectedGroup.question}</p>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={handleReset}
                >
                  처음부터 다시 보기
                </button>
              </div>

              <div className={styles.optionGrid}>
                {selectedGroup.actions.map((action) => {
                  const isSelected = action.id === selectedActionId;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={`${styles.optionButton} ${
                        isSelected ? styles.optionButtonSelected : ''
                      }`}
                      onClick={() => {
                        setSelectedActionId(action.id);
                        setSelectedApplicationAction('');
                        setTourActionItems([]);
                        setTourActionError('');
                        if (action.type !== 'room-finder') {
                          setRoomResults([]);
                          setRoomSearchError('');
                          setHasRoomSearchAttempted(false);
                        }
                        if (action.type !== 'facility-picker') {
                          setFacilityItems([]);
                          setFacilityError('');
                        }
                      }}
                    >
                      <strong className={styles.optionTitle}>
                        {action.label}
                      </strong>
                      <span className={styles.optionDescription}>
                        {action.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isApplicationMenuAction && (
            <div
              ref={applicationActionRef}
              className={`${styles.finderCard} ${styles.scrollAnchor}`}
            >
              <div className={styles.finderSection}>
                <p className={styles.question}>어떤 신청 업무를 하시겠어요?</p>
                <div className={styles.optionGrid}>
                  {[
                    {
                      id: 'tour-apply',
                      label: '투어 신청',
                      description:
                        '매물을 고른 뒤 바로 투어 신청으로 이어집니다.',
                    },
                    {
                      id: 'tour-edit',
                      label: '신청 변경',
                      description:
                        '현재 대기중인 투어 일정만 골라서 변경합니다.',
                    },
                    {
                      id: 'tour-cancel',
                      label: '신청 취소',
                      description:
                        '현재 대기중인 투어 신청만 골라서 취소합니다.',
                    },
                  ].map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={`${styles.optionButton} ${
                        selectedApplicationAction === action.id
                          ? styles.optionButtonSelected
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedApplicationAction(action.id);
                        setRoomResults([]);
                        setRoomSearchError('');
                        setHasRoomSearchAttempted(false);
                      }}
                    >
                      <strong className={styles.optionTitle}>
                        {action.label}
                      </strong>
                      <span className={styles.optionDescription}>
                        {action.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {(selectedApplicationAction === 'tour-edit' ||
                selectedApplicationAction === 'tour-cancel') && (
                <div
                  ref={tourActionListRef}
                  className={`${styles.finderSection} ${styles.scrollAnchor}`}
                >
                  <p className={styles.question}>
                    {selectedApplicationAction === 'tour-edit'
                      ? '변경할 투어 신청을 골라주세요.'
                      : '취소할 투어 신청을 골라주세요.'}
                  </p>
                  <p className={styles.helperText}>
                    현재는 승인대기 상태인 투어만 변경하거나 취소할 수 있습니다.
                  </p>

                  {tourActionError && (
                    <p className={styles.errorText}>{tourActionError}</p>
                  )}

                  {tourActionLoading ? (
                    <div className={styles.emptyResult}>
                      신청 내역을 불러오는 중입니다...
                    </div>
                  ) : tourActionItems.length > 0 ? (
                    <div className={styles.resultGrid}>
                      {tourActionItems.map((item) => (
                        <article
                          key={item.tourNo}
                          className={styles.resultCard}
                        >
                          <div className={styles.resultMeta}>
                            <span className={styles.resultBadge}>
                              {tourStatusLabel(item.status)}
                            </span>
                          </div>
                          <h4 className={styles.resultTitle}>
                            {item.roomName ||
                              `매물 ${item.roomNo || item.tourNo}`}
                          </h4>
                          <p className={styles.resultPrice}>
                            투어일 {formatDate(item.visitDate)}
                          </p>
                          <p className={styles.resultInfo}>
                            신청번호 {item.tourNo} · 방문 시간{' '}
                            {String(item.visitTime || '').slice(0, 5) || '-'}
                          </p>
                          <div className={styles.resultActions}>
                            <button
                              type="button"
                              className={styles.primaryAction}
                              onClick={() =>
                                navigate(
                                  `/mypage/applications/tour/${item.tourNo}`,
                                  {
                                    state: { item },
                                  }
                                )
                              }
                            >
                              {selectedApplicationAction === 'tour-edit'
                                ? '변경하기'
                                : '취소하기'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyResult}>
                      {selectedApplicationAction === 'tour-edit'
                        ? '변경할 수 있는 투어 신청이 없습니다.'
                        : '취소할 수 있는 투어 신청이 없습니다.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {shouldShowRoomFinder && (
            <div
              ref={roomFinderRef}
              className={`${styles.finderCard} ${styles.scrollAnchor}`}
            >
              <div className={styles.finderSection}>
                <p className={styles.question}>{roomFinderTitle}</p>
                <div className={styles.chipRow}>
                  {[
                    { value: 'L', label: '전세' },
                    { value: 'M', label: '월세' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterChip} ${
                        roomFinder.roomType === option.value
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() =>
                        handleRoomFinderChange('roomType', option.value)
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.finderSection}>
                <p className={styles.question}>몇 분이 지낼 예정이신가요?</p>
                <div className={styles.chipRow}>
                  {[
                    { value: 1, label: '1명' },
                    { value: 2, label: '2명' },
                    { value: 3, label: '3명 이상' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterChip} ${
                        roomFinder.roomRoomCount === option.value
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() =>
                        handleRoomFinderChange('roomRoomCount', option.value)
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.finderSection}>
                <p className={styles.question}>
                  {roomFinder.roomType === 'L'
                    ? '전세 예산은 어느 정도 생각하고 계신가요?'
                    : '보증금은 어느 정도가 좋으신가요?'}
                </p>
                <p className={styles.helperText}>
                  예산을 고르면 조건에 맞는 매물을 더 정확하게 찾아드릴 수
                  있습니다.
                </p>
                <div className={styles.chipRow}>
                  {depositBudgetOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.filterChip} ${
                        roomFinder.depositBudgetKey === option.id
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() =>
                        handleRoomFinderChange(
                          'depositBudgetKey',
                          roomFinder.depositBudgetKey === option.id
                            ? ''
                            : option.id
                        )
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {roomFinder.roomType === 'M' && (
                <div className={styles.finderSection}>
                  <p className={styles.question}>
                    월세는 어느 정도 생각하고 계신가요?
                  </p>
                  <div className={styles.chipRow}>
                    {WOLSE_MONTHLY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.filterChip} ${
                          roomFinder.monthlyBudgetKey === option.id
                            ? styles.filterChipActive
                            : ''
                        }`}
                        onClick={() =>
                          handleRoomFinderChange(
                            'monthlyBudgetKey',
                            roomFinder.monthlyBudgetKey === option.id
                              ? ''
                              : option.id
                          )
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.finderSection}>
                <p className={styles.question}>꼭 필요한 조건이 있으신가요?</p>
                <p className={styles.helperText}>
                  필요한 조건만 눌러주세요. 여러 개를 함께 선택할 수 있습니다.
                </p>
                <div className={styles.chipRow}>
                  {ROOM_FEATURE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.filterChip} ${
                        roomFinder[option.id] ? styles.filterChipActive : ''
                      }`}
                      onClick={() => handleRoomFeatureToggle(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.finderSection}>
                <p className={styles.question}>
                  원하는 지역이 있으면 적어주세요.
                </p>
                <p className={styles.helperText}>
                  예: 신촌, 강남역, 마포구. 비워 두면 넓게 찾아드릴게요.
                </p>
                <input
                  type="text"
                  className={styles.keywordInput}
                  value={roomFinder.keyword}
                  onChange={(event) =>
                    handleRoomFinderChange('keyword', event.target.value)
                  }
                  placeholder="지역 또는 역 이름을 입력하세요"
                />
              </div>

              <div className={styles.finderActions}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={runRoomFinder}
                  disabled={roomSearchLoading}
                >
                  {roomSearchLoading
                    ? '매물 찾는 중...'
                    : selectedApplicationAction === 'tour-apply'
                      ? '투어 신청할 매물 찾기'
                      : '추천 매물 보기'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setRoomFinder(createInitialRoomFinder());
                    setRoomResults([]);
                    setRoomSearchError('');
                    setHasRoomSearchAttempted(false);
                  }}
                >
                  조건 다시 고르기
                </button>
              </div>

              <div ref={roomResultsRef} className={styles.scrollAnchor}>
                {roomSearchError && (
                  <p className={styles.errorText}>{roomSearchError}</p>
                )}

                {roomResults.length > 0 && (
                  <div className={styles.resultSection}>
                    <div className={styles.resultHeader}>
                      <div>
                        <p className={styles.summaryLabel}>찾아본 매물</p>
                        <h3 className={styles.summaryTitle}>
                          조건에 맞는 매물을 바로 확인해 보세요.
                        </h3>
                      </div>
                    </div>

                    <div className={styles.resultGrid}>
                      {roomResults.map((room) => (
                        <article
                          key={room.roomNo}
                          className={styles.resultCard}
                        >
                          <div className={styles.resultMeta}>
                            <span className={styles.resultBadge}>
                              {roomMethodLabel(room.roomMethod)}
                            </span>
                            {room.roomEmptyYn && (
                              <span className={styles.resultBadgeMuted}>
                                공실
                              </span>
                            )}
                          </div>
                          <h4 className={styles.resultTitle}>
                            {room.roomName || `매물 ${room.roomNo}`}
                          </h4>
                          <p className={styles.resultPrice}>
                            {roomPriceText(room)}
                          </p>
                          <p className={styles.resultInfo}>
                            {[
                              occupancyLabel(room.roomRoomCount),
                              room.houseAddress,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <div className={styles.resultActions}>
                            <button
                              type="button"
                              className={styles.primaryAction}
                              onClick={() =>
                                navigate(
                                  selectedApplicationAction === 'tour-apply'
                                    ? `/rooms/${room.roomNo}/tour`
                                    : `/rooms/${room.roomNo}`
                                )
                              }
                            >
                              {selectedApplicationAction === 'tour-apply'
                                ? '투어 신청'
                                : '상세보기'}
                            </button>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() =>
                                navigate(
                                  selectedApplicationAction === 'tour-apply'
                                    ? `/rooms/${room.roomNo}`
                                    : `/rooms/${room.roomNo}/tour`
                                )
                              }
                            >
                              {selectedApplicationAction === 'tour-apply'
                                ? '상세보기'
                                : '투어 신청'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {!roomSearchLoading &&
                  roomResults.length === 0 &&
                  !roomSearchError &&
                  hasRoomSearchAttempted && (
                    <div className={styles.emptyResult}>
                      조건에 맞는 매물을 아직 찾지 못했습니다. 예산이나 지역
                      조건을 조금 넓혀서 다시 찾아보세요.
                    </div>
                  )}

                {!roomSearchLoading &&
                  roomResults.length === 0 &&
                  !roomSearchError &&
                  !hasRoomSearchAttempted && (
                    <div className={styles.emptyResult}>
                      버튼을 고른 뒤{' '}
                      {selectedApplicationAction === 'tour-apply'
                        ? '`투어 신청할 매물 찾기`'
                        : '`추천 매물 보기`'}{' '}
                      를 누르면 여기에서 바로 매물 후보를 보여드립니다.
                    </div>
                  )}
              </div>
            </div>
          )}

          {isFacilityPickerAction && (
            <div
              ref={facilityPickerRef}
              className={`${styles.finderCard} ${styles.scrollAnchor}`}
            >
              <div className={styles.finderSection}>
                <p className={styles.question}>
                  예약할 수 있는 공용시설을 골라주세요.
                </p>
                <p className={styles.helperText}>
                  시설을 누르면 바로 예약 페이지로 이동합니다.
                </p>

                {facilityError && (
                  <p className={styles.errorText}>{facilityError}</p>
                )}

                {facilityLoading ? (
                  <div className={styles.emptyResult}>
                    공용시설 목록을 불러오는 중입니다...
                  </div>
                ) : facilityItems.length > 0 ? (
                  <div className={styles.resultGrid}>
                    {facilityItems.map((facility) => (
                      <article
                        key={facility.facilityNo}
                        className={styles.resultCard}
                      >
                        <div className={styles.resultMeta}>
                          <span className={styles.resultBadge}>예약 가능</span>
                        </div>
                        <h4 className={styles.resultTitle}>
                          {facility.facilityName ||
                            `시설 ${facility.facilityNo}`}
                        </h4>
                        <p className={styles.resultPrice}>
                          {facility.facilityOpenTime?.slice(0, 5) || '-'} ~{' '}
                          {facility.facilityCloseTime?.slice(0, 5) || '-'}
                        </p>
                        <p className={styles.resultInfo}>
                          {[
                            facility.facilityLocation,
                            facility.facilityCapacity
                              ? `수용 ${facility.facilityCapacity}명`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <div className={styles.resultActions}>
                          <button
                            type="button"
                            className={styles.primaryAction}
                            onClick={() =>
                              navigate(
                                `/reservation/form/${facility.facilityNo}`
                              )
                            }
                          >
                            예약하기
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyResult}>
                    지금 예약할 수 있는 공용시설이 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedAction &&
            !shouldShowRoomFinder &&
            !isApplicationMenuAction &&
            !isFacilityPickerAction && (
              <div
                ref={moveStepRef}
                className={`${styles.summaryCard} ${styles.scrollAnchor}`}
              >
                <div>
                  <p className={styles.summaryLabel}>선택한 메뉴</p>
                  <h3 className={styles.summaryTitle}>
                    {selectedAction.label}
                  </h3>
                  <p className={styles.summaryDescription}>
                    {selectedAction.description}
                  </p>
                </div>

                <div className={styles.summaryActions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => navigate(selectedAction.to)}
                  >
                    이 페이지로 이동하기
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setSelectedActionId(null)}
                  >
                    다른 세부 메뉴 보기
                  </button>
                </div>
              </div>
            )}
        </div>
      )}
    </section>
  );
}
