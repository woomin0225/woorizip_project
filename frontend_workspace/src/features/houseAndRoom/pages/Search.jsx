import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SearchFilterPanel from './../components/Search/SearchFilterPanel';
import MapPanel from '../components/Search/MapPanel';
import ResultList from './../components/Search/ResultList';
import ResultItem from './../components/Search/ResultItem';

import { searchRooms, searchRoomsByNaturalText } from '../api/roomApi';
import { getHouseMarkers, getRoomsInHouseMarker } from '../api/houseApi';
import { tokenStore } from '../../../app/http/tokenStore';
import { parseJwt } from '../../../app/providers/utils/jwt';
import {
  addWishlist,
  deleteWishlist,
  getWishlistByUser,
} from '../../wishlist/api/wishlistAPI';

import styles from './Search.module.css';

// 한 번에 몇 개의 방을 가져올지 정하는 상수입니다.
// 기존 검색 로직이 이 값을 기준으로 페이징하고 있으므로 그대로 재사용합니다.
const PAGE_SIZE = 10;
const SEMANTIC_PREVIEW_LIMIT = 5;

// 자연어 문장에서 "옵션"으로 볼 수 있는 단어 묶음입니다.
// 예를 들어 사용자가 "와이파이 있는 방", "wifi 있는 방"처럼 여러 식으로 말해도
// 최종적으로는 기존 필터가 이해하는 값("WiFi")으로 맞춰 주기 위해 사용합니다.
const OPTION_ALIASES = {
  WiFi: ['wifi', 'wi-fi', '인터넷', '무선인터넷'],
  에어컨: ['에어컨', '에어콘', 'air conditioner', 'aircon', 'ac'],
  냉장고: ['냉장고', 'fridge', 'refrigerator'],
  세탁기: ['세탁기', 'washer', 'washing machine'],
  침대: ['침대', 'bed'],
  책상: ['책상', 'desk'],
  옷장: ['옷장', 'closet', 'wardrobe'],
  TV: ['tv', '티비', '티브이', '텔레비전'],
  신발장: ['신발장', 'shoe rack', 'shoe cabinet'],
};

function getCurrentUserNo() {
  // 검색 페이지에서도 찜 기능을 써야 하므로 현재 로그인한 사용자를 알아야 합니다.
  // 이미 다른 화면에서 저장해 둔 userNo가 있으면 그 값을 바로 사용합니다.
  const storedUserNo = localStorage.getItem('userNo');
  if (storedUserNo) return storedUserNo;

  // userNo가 따로 없으면 accessToken을 읽어서 JWT 안의 payload에서 userNo를 꺼냅니다.
  const token = tokenStore.getAccess();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return payload.userNo || null;
}

function normalizeText(text) {
  // 자연어 비교는 대소문자 차이에 덜 민감해야 하므로
  // 검색 전에 모두 소문자로 맞춰 둡니다.
  return String(text || '').toLowerCase();
}

function toMoneyValue(rawNumber, unit = '') {
  // 사용자는 "1000", "50만", "2억"처럼 여러 방식으로 금액을 말할 수 있습니다.
  // 기존 검색 필터는 숫자 하나만 받으므로 여기서 실제 금액 숫자로 통일합니다.
  const normalized = String(rawNumber || '').replace(/,/g, '');
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;

  if (unit.includes('억')) return Math.round(numeric * 100_000_000);
  if (unit.includes('만')) return Math.round(numeric * 10_000);
  if (unit.includes('원')) return Math.round(numeric);

  // 단위를 생략하고 "1000 이하"처럼 말하는 경우는
  // 현재 서비스 문맥상 "1000만 원"으로 해석하는 편이 자연스럽습니다.
  if (numeric >= 10_000) return Math.round(numeric);
  return Math.round(numeric * 10_000);
}

function extractMoneyRange(text, keywords) {
  // 이 함수는 "보증금 1000 이하", "월세 50~70", "관리비 10 이하"처럼
  // 자연어 안에 들어 있는 금액 조건을 기존 min/max 필터 구조로 바꿔 줍니다.
  const source = String(text || '');
  const keywordPattern = keywords
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const rangePattern = new RegExp(
    `(?:${keywordPattern})\\s*(?:은|는|이|가)?\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(억|만원|만|원)?\\s*(?:~|-|부터)\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(억|만원|만|원)?`,
    'i'
  );
  const maxPattern = new RegExp(
    `(?:${keywordPattern})\\s*(?:은|는|이|가)?\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(억|만원|만|원)?\\s*(?:이하|미만|까지|이내)`,
    'i'
  );
  const minPattern = new RegExp(
    `(?:${keywordPattern})\\s*(?:은|는|이|가)?\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(억|만원|만|원)?\\s*(?:이상|초과|부터)`,
    'i'
  );

  const rangeMatch = source.match(rangePattern);
  if (rangeMatch) {
    return {
      min: toMoneyValue(rangeMatch[1], rangeMatch[2] || ''),
      max: toMoneyValue(rangeMatch[3], rangeMatch[4] || ''),
    };
  }

  const maxMatch = source.match(maxPattern);
  if (maxMatch) {
    return {
      min: null,
      max: toMoneyValue(maxMatch[1], maxMatch[2] || ''),
    };
  }

  const minMatch = source.match(minPattern);
  if (minMatch) {
    return {
      min: toMoneyValue(minMatch[1], minMatch[2] || ''),
      max: null,
    };
  }

  return { min: null, max: null };
}

function extractKeyword(text) {
  // 자연어 전체를 keyword 필드에 그대로 넣으면 기존 검색과 충돌하기 쉽습니다.
  // 그래서 "신촌 근처", "강남역 주변", "마포구"처럼
  // 위치나 키워드로 보기 쉬운 부분만 뽑아서 기존 keyword 검색에 연결합니다.
  const source = String(text || '');
  const patterns = [
    /([가-힣A-Za-z0-9]{2,})\s*(?:역|근처|인근|주변|부근|쪽)/g,
    /\b([가-힣]{2,}(?:구|동))\b/g,
    /['"]([^'"]+)['"]/g,
  ];

  const values = [];
  patterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      const value = String(match[1] || '').trim();
      if (value) values.push(value);
    }
  });

  return Array.from(new Set(values)).join(' ');
}

function extractOptionNames(text) {
  // 옵션은 체크박스 필터와 정확히 같은 문자열이 들어가야 하므로
  // 자연어 표현을 OPTION_ALIASES를 이용해 표준 이름으로 변환합니다.
  const lowered = normalizeText(text);
  const matched = [];

  Object.entries(OPTION_ALIASES).forEach(([name, aliases]) => {
    if (aliases.some((alias) => lowered.includes(alias.toLowerCase()))) {
      matched.push(name);
    }
  });

  return matched;
}

function buildNaturalSearchPatch(text, baseCond) {
  // 이 함수가 자연어 검색의 핵심입니다.
  // "문장 전체"를 완벽히 이해하려고 하지 않고,
  // 기존 필터에 안전하게 매핑할 수 있는 정보만 골라서 cond에 덮어씁니다.
  //
  // 이렇게 한 이유:
  // 1. 기존 검색 API와 UI를 최대한 유지하기 위해서
  // 2. 필터로 정확히 표현할 수 있는 값은 DB 검색에 맡기고
  // 3. 나머지 애매한 의미(예: 채광 좋은, 조용한)는 RAG에 맡기기 위해서
  const source = String(text || '');
  const lowered = normalizeText(source);
  const nextCond = { ...baseCond };
  const appliedLabels = [];

  const roomType =
    lowered.includes('전세') || lowered.includes('long-term')
      ? 'L'
      : lowered.includes('월세') || lowered.includes('monthly')
        ? 'M'
        : null;

  if (roomType) {
    nextCond.roomType = roomType;

    // 전세 검색으로 바뀌면 월세 필터는 의미가 없으므로 같이 지웁니다.
    if (roomType === 'L') {
      nextCond.minTax = null;
      nextCond.maxTax = null;
    }
    appliedLabels.push(`거래유형 ${roomType === 'L' ? '전세' : '월세'}`);
  }

  const depositRange = extractMoneyRange(source, ['보증금', 'deposit']);
  if (depositRange.min !== null) {
    nextCond.minDeposit = depositRange.min;
  }
  if (depositRange.max !== null) {
    nextCond.maxDeposit = depositRange.max;
  }
  if (depositRange.min !== null || depositRange.max !== null) {
    appliedLabels.push('보증금');
  }

  const taxRange = extractMoneyRange(source, ['월세', '관리비', 'rent']);
  if (taxRange.min !== null) {
    nextCond.minTax = taxRange.min;
  }
  if (taxRange.max !== null) {
    nextCond.maxTax = taxRange.max;
  }
  if (taxRange.min !== null || taxRange.max !== null) {
    appliedLabels.push('월세');
  }

  // "2인 가능", "3명 가능" 같은 표현을 수용인원 필터로 연결합니다.
  const roomCountMatch = source.match(/(\d+)\s*(?:인|명)\s*(?:실|가능)?/);
  if (roomCountMatch) {
    nextCond.roomRoomCount = Number(roomCountMatch[1]);
    appliedLabels.push(`수용인원 ${roomCountMatch[1]}인 이상`);
  }

  const keyword = extractKeyword(source);
  if (keyword) {
    nextCond.keyword = keyword;
    appliedLabels.push(`키워드 ${keyword}`);
  }

  const options = extractOptionNames(source);
  if (options.length > 0) {
    nextCond.options = options.join(',');
    appliedLabels.push(`옵션 ${options.join(', ')}`);
  }

  if (
    lowered.includes('여성전용') ||
    lowered.includes('여성 전용') ||
    lowered.includes('여자만')
  ) {
    nextCond.houseFemaleLimit = true;
    appliedLabels.push('여성전용');
  }

  if (
    lowered.includes('반려동물') ||
    lowered.includes('애완동물') ||
    lowered.includes('펫 가능') ||
    lowered.includes('반려 가능')
  ) {
    nextCond.housePetYn = true;
    appliedLabels.push('반려동물 가능');
  }

  if (lowered.includes('주차')) {
    nextCond.houseParking = true;
    appliedLabels.push('주차 가능');
  }

  if (lowered.includes('엘리베이터')) {
    nextCond.houseElevatorYn = true;
    appliedLabels.push('엘리베이터');
  }

  return {
    nextCond,
    appliedLabels: Array.from(new Set(appliedLabels)),
  };
}

export default function Search() {
  // 이 객체가 "검색 조건의 기본값"입니다.
  // 기존 페이지가 기대하는 필터 구조를 유지하기 위해 별도 자연어 전용 조건 객체를 만들지 않고
  // 같은 구조를 그대로 사용합니다.
  const initialCond = {
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
    houseElevatorYn: true,
    housePetYn: false,
    houseFemaleLimit: false,
    houseParking: true,
    criterion: 'LATEST',
  };

  // cond:
  // 사용자가 현재 화면에서 보고 수정 중인 "실시간 입력값"입니다.
  const [cond, setCond] = useState(initialCond);

  // appliedCond:
  // 실제 검색 버튼을 눌렀을 때 서버로 보낸 "확정 조건"입니다.
  // 입력 중인 값과 서버에 적용된 값을 분리해 두면 정렬/지도 이동/더보기 로직이 안정적입니다.
  const [appliedCond, setAppliedCond] = useState(null);

  // 지도에서 보고 있는 현재 영역입니다.
  // 검색 API가 bbox를 필수로 받기 때문에 별도 상태로 유지합니다.
  const initialBbox = {
    swLat: initialCond.swLat,
    swLng: initialCond.swLng,
    neLat: initialCond.neLat,
    neLng: initialCond.neLng,
  };
  const [bbox, setBbox] = useState(initialBbox);
  const [searchBbox, setSearchBbox] = useState(initialBbox);

  // 기존 검색 결과 관련 상태들입니다.
  const [rooms, setRooms] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  // 자연어 검색 관련 상태들입니다.
  // 기존 검색과 섞지 않고 분리해 두어야 UI가 단순해집니다.
  const [naturalQuery, setNaturalQuery] = useState('');
  const [naturalRooms, setNaturalRooms] = useState([]);
  const [loadingNatural, setLoadingNatural] = useState(false);
  const [naturalError, setNaturalError] = useState('');
  const [naturalAppliedLabels, setNaturalAppliedLabels] = useState([]);
  const [isNaturalSearchMode, setIsNaturalSearchMode] = useState(false);
  const [pendingMapSearch, setPendingMapSearch] = useState(false);

  // 찜 기능 관련 상태입니다.
  const currentUserNo = useMemo(() => getCurrentUserNo(), []);
  const [wishMap, setWishMap] = useState({});

  // 지도 마커를 눌렀을 때 나오는 미니 팝업용 상태입니다.
  const [markerPopup, setMarkerPopup] = useState(null);
  const [hoveredHouseNo, setHoveredHouseNo] = useState(null);

  // 현재 검색이 전세인지 월세인지에 따라 정렬 버튼 UI가 달라지므로 따로 둡니다.
  const [isJeonse, setIsJeonse] = useState(cond.roomType === 'L' || false);

  useEffect(() => {
    // 페이지 첫 진입 시 기존 검색과 동일하게 한 번 자동 검색합니다.
    const first = { ...initialCond };

    setCond(first);
    setAppliedCond(first);
    runSearch(first, bbox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildWishMap(list) {
    // 서버에서 받은 찜 목록을 roomNo 기준으로 빠르게 찾기 위한 맵 구조로 바꿉니다.
    // 이렇게 해 두면 각 카드에서 "이 방이 찜 상태인지"를 O(1)로 확인할 수 있습니다.
    const map = {};
    (list || []).forEach((item) => {
      if (!item?.roomNo) return;
      map[item.roomNo] = item.wishNo || true;
    });
    return map;
  }

  const loadWishlistMap = useCallback(async () => {
    if (!currentUserNo) {
      setWishMap({});
      return;
    }

    try {
      const list = await getWishlistByUser(currentUserNo, 1, 200);
      setWishMap(buildWishMap(list));
    } catch {
      // 찜 로딩 실패가 검색 페이지 전체를 막을 필요는 없으므로
      // 에러를 던지지 않고 빈 상태로만 둡니다.
      setWishMap({});
    }
  }, [currentUserNo]);

  useEffect(() => {
    loadWishlistMap();
  }, [loadWishlistMap]);

  const handleCondChange = (event) => {
    // 기존 필터 패널이 보내는 onChange 이벤트를 공통으로 처리합니다.
    const { name, type, value, checked } = event.target;

    setCond((current) => {
      if (type === 'checkbox') return { ...current, [name]: checked };

      const numberFields = new Set([
        'minDeposit',
        'maxDeposit',
        'minTax',
        'maxTax',
        'roomRoomCount',
      ]);

      if (numberFields.has(name)) {
        // 기존 화면의 UX를 유지하기 위해
        // 비정상 숫자나 비어 있는 값은 null로 통일합니다.
        if ((name === 'maxDeposit' || name === 'maxTax') && Number(value) === 0) {
          return {
            ...current,
            [name]: null,
          };
        }
        if ((name === 'minDeposit' || name === 'minTax') && value < 0) {
          return {
            ...current,
            [name]: null,
          };
        }

        return {
          ...current,
          [name]: value === '' || value === null ? null : Number(value),
        };
      }
      return { ...current, [name]: value };
    });
  };

  const handleOptionsChange = (event) => {
    // 옵션 체크박스는 문자열 하나가 아니라 "쉼표로 연결된 옵션 목록"을 다뤄야 해서
    // 일반 input과 별도 처리합니다.
    const value = event.target.value;
    const checked = event.target.checked;

    setCond((current) => {
      let arr = (current.options || '').split(',').filter((v) => v !== '');
      if (checked) {
        if (!arr.includes(value)) arr.push(value);
      } else {
        arr = arr.filter((v) => v !== value);
      }

      return { ...current, options: arr.join(',') };
    });
  };

  async function runSearch(firstCond, firstBbox) {
    // 이 함수는 "기존 검색"의 실제 트리거입니다.
    // 자연어 검색을 하더라도 결국 하단 결과는 이 함수로 다시 검색합니다.
    setLoadingRooms(true);
    setLoadingMarkers(true);
    setMarkerPopup(null);

    try {
      const merged = { ...firstCond, ...firstBbox };

      // 목록과 지도 마커는 서로 독립적이므로 동시에 요청해 응답 시간을 줄입니다.
      const [slice, markerList] = await Promise.all([
        searchRooms(merged, 0, PAGE_SIZE),
        getHouseMarkers(merged),
      ]);

      setRooms(slice?.content ?? []);
      setMarkers(markerList ?? []);
      setSearchBbox(firstBbox);
      setPage(slice?.number ?? 0);
      setHasNext(
        typeof slice?.hasNext === 'boolean' ? slice.hasNext : !slice?.last
      );
    } finally {
      setLoadingRooms(false);
      setLoadingMarkers(false);
    }

    if (firstCond.roomType === 'L') setIsJeonse(true);
    if (firstCond.roomType === 'M') setIsJeonse(false);
  }

  async function runNaturalSearch() {
    const query = naturalQuery.trim();
    if (!query) {
      setNaturalRooms([]);
      setNaturalError('');
      setNaturalAppliedLabels([]);
      return;
    }

    // 자연어를 그대로 서버에 보내는 것만으로 끝내지 않고
    // 먼저 프론트에서 기존 필터에 매핑 가능한 값을 추출해 cond에 반영합니다.
    // 이렇게 하면 사용자는 "AI가 어떤 조건을 읽었는지"를 즉시 필터 패널에서 확인할 수 있습니다.
    const { nextCond, appliedLabels } = buildNaturalSearchPatch(query, cond);
    setCond(nextCond);
    setAppliedCond(nextCond);
    setNaturalAppliedLabels(appliedLabels);

    setLoadingNatural(true);
    setNaturalError('');
    setIsNaturalSearchMode(false);
    setPendingMapSearch(false);
    try {
      // 자연어 검색의 목표는 두 가지입니다.
      // 1. 상단에는 의미 기반 추천(RAG) 결과를 보여 주기
      // 2. 하단에는 같은 문장에서 추출한 필터로 일반 검색 결과를 보여 주기
      const [list] = await Promise.all([
        searchRoomsByNaturalText(query),
        runSearch(nextCond, bboxRef.current),
      ]);
      setNaturalRooms(Array.isArray(list) ? list : []);
      setIsNaturalSearchMode(true);
      setPendingMapSearch(false);
    } catch (e) {
      setNaturalRooms([]);
      setNaturalError(e?.message || '자연어 검색에 실패했습니다.');
    } finally {
      setLoadingNatural(false);
    }
  }

  function clearNaturalSearch() {
    const shouldRefreshForCurrentMap = pendingMapSearch;
    // 자연어 입력과 상단 추천 결과만 초기화합니다.
    // 기존 필터 전체를 되돌리지는 않는 이유는
    // 사용자가 자연어 검색 후 수동으로 미세 조정하는 흐름을 막지 않기 위해서입니다.
    setNaturalQuery('');
    setNaturalRooms([]);
    setNaturalError('');
    setNaturalAppliedLabels([]);
    setLoadingNatural(false);
    setIsNaturalSearchMode(false);
    setPendingMapSearch(false);

    if (shouldRefreshForCurrentMap) {
      const base = appliedCond ?? cond;
      if (base) runSearch(base, bboxRef.current);
    }
  }

  const clickSearch = () => {
    // 사용자가 직접 필터 검색 버튼을 눌렀을 때는
    // 현재 화면 입력값(cond)을 확정 조건(appliedCond)으로 승격시킵니다.
    const nextApplied = { ...cond };
    setAppliedCond(nextApplied);
    setIsNaturalSearchMode(false);
    setPendingMapSearch(false);
    runSearch(nextApplied, bboxRef.current);
  };

  const changeCriterion = (nextCriterion) => {
    // 정렬은 화면 입력값과 실제 검색값 모두를 같이 바꿔야
    // 더보기나 지도 이동 시에도 같은 정렬 기준이 유지됩니다.
    setCond((current) => ({ ...current, criterion: nextCriterion }));

    const base = appliedCond ?? cond;
    const nextApplied = { ...base, criterion: nextCriterion };

    setAppliedCond(nextApplied);
    setIsNaturalSearchMode(false);
    setPendingMapSearch(false);
    runSearch(nextApplied, bboxRef.current);
  };

  // bbox는 객체라서 이전 값 비교가 필요합니다.
  // ref를 두면 불필요한 재검색을 막을 수 있습니다.
  const bboxRef = useRef(bbox);

  useEffect(() => {
    bboxRef.current = bbox;
  }, [bbox]);

  const handleChangeBbox = (nextBbox) => {
    const prev = bboxRef.current;
    const same =
      prev &&
      Math.abs(prev.swLat - nextBbox.swLat) < 1e-6 &&
      Math.abs(prev.swLng - nextBbox.swLng) < 1e-6 &&
      Math.abs(prev.neLat - nextBbox.neLat) < 1e-6 &&
      Math.abs(prev.neLng - nextBbox.neLng) < 1e-6;
    if (same) return;

    setBbox(nextBbox);
    setMarkerPopup(null);

    if (!appliedCond) {
      const first = { ...cond };
      setAppliedCond(first);
      runSearch(first, nextBbox);
      return;
    }

    // 지도를 움직였을 때는 현재 "적용 중인 조건" 기준으로만 재검색합니다.
    if (isNaturalSearchMode) {
      setPendingMapSearch(true);
      return;
    }

    runSearch(appliedCond, nextBbox);
  };

  const rerunSearchInCurrentMap = () => {
    if (!appliedCond) return;
    setPendingMapSearch(false);
    runSearch(appliedCond, bboxRef.current);
  };

  const onLoadMore = async () => {
    // 더보기는 하단 일반 검색 결과만 누적합니다.
    // 상단 AI 추천 결과는 별도 의미 검색 결과이므로 페이지를 늘리지 않습니다.
    setMarkerPopup(null);
    if (!appliedCond) return;
    if (loadingRooms || !hasNext) return;

    setLoadingRooms(true);
    try {
      const nextPage = page + 1;
      const merged = { ...appliedCond, ...searchBbox };

      const slice = await searchRooms(merged, nextPage, PAGE_SIZE);
      const content = slice?.content ?? [];

      setRooms((prev) => [...prev, ...content]);
      setPage(slice?.number ?? nextPage);
      setHasNext(
        typeof slice?.hasNext === 'boolean' ? slice.hasNext : !slice?.last
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  async function toggleWish(roomNo, nextWished) {
    if (!currentUserNo) {
      alert('찜 기능은 로그인 후 사용할 수 있습니다.');
      return false;
    }

    try {
      if (nextWished) {
        await addWishlist(roomNo);
      } else {
        const wishNo = wishMap?.[roomNo];
        if (wishNo && wishNo !== true) {
          await deleteWishlist(wishNo);
        } else {
          const list = await getWishlistByUser(currentUserNo, 1, 200);
          const target = list.find(
            (item) => String(item.roomNo) === String(roomNo)
          );
          if (target?.wishNo) await deleteWishlist(target.wishNo);
        }
      }
      await loadWishlistMap();
      return true;
    } catch (e) {
      alert(e.message || '찜 처리에 실패했습니다.');
      return false;
    }
  }

  async function handleMarkerClick(mk) {
    // 마커 클릭 시에는 해당 건물 안의 방만 다시 조회합니다.
    // 이때도 현재 적용 중인 필터 조건을 유지해야 사용자가 예상한 결과가 나옵니다.
    setMarkerPopup(null);

    const base = appliedCond ?? cond;
    const slice = await getRoomsInHouseMarker(mk.houseNo, base, 0, 10);
    const list = slice?.content ?? [];

    setMarkerPopup({
      house: mk,
      houseNo: mk.houseNo,
      lat: mk.houseLat,
      lng: mk.houseLng,
      imageNames: mk.imageNames,
      rooms: list,
    });
  }

  function closeMarkerPopup() {
    setMarkerPopup(null);
  }

  // 자연어 입력이 있거나 자연어 결과가 존재하면 상단 AI 추천 섹션을 보여 줍니다.
  const showSemanticSection =
    loadingNatural || naturalRooms.length > 0 || naturalQuery.trim();
  const semanticPreviewRooms = naturalRooms.slice(0, SEMANTIC_PREVIEW_LIMIT);
  const showNormalSection =
    loadingRooms || rooms.length > 0 || naturalQuery.trim() || appliedCond !== null;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <form
          className={styles.naturalSearch}
          onSubmit={(e) => {
            e.preventDefault();
            runNaturalSearch();
          }}
        >
          <label className={styles.naturalLabel}>✨AI 검색</label>
          <div className={styles.naturalRow}>
            <input
              className={styles.naturalInput}
              type="text"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="예: 신촌 근처 보증금 1000 이하이고 여성전용인 방"
            />
            <button
              className={styles.naturalBtn}
              type="submit"
              disabled={loadingNatural}
            >
              {loadingNatural ? '검색 중...' : 'AI 검색'}
            </button>
            <button
              className={styles.naturalResetBtn}
              type="button"
              onClick={clearNaturalSearch}
              disabled={loadingNatural}
            >
              초기화
            </button>
          </div>

          {/* 자연어에서 실제로 읽어 낸 조건을 칩으로 보여 줍니다.
              "무슨 뜻으로 해석했는지"를 사용자에게 설명하기 위한 UI입니다. */}
          {naturalAppliedLabels.length > 0 && (
            <div className={styles.naturalApplied}>
              {naturalAppliedLabels.map((label) => (
                <span key={label} className={styles.naturalChip}>
                  {label}
                </span>
              ))}
            </div>
          )}

          {isNaturalSearchMode && (
            <div className={styles.naturalModeBanner}>
              <div className={styles.naturalModeCopy}>
                <strong className={styles.naturalModeTitle}>AI 검색 모드</strong>
                <div className={styles.naturalModeText}>
                  {pendingMapSearch
                    ? '지도를 옮겼습니다. 현재 결과는 이전 지도 기준으로 유지되고 있습니다.'
                    : '현재 결과를 유지합니다. 새 지도 범위를 반영하려면 다시 검색하세요.'}
                </div>
              </div>

              {pendingMapSearch ? (
                <button
                  className={styles.naturalMapRefreshBtn}
                  type="button"
                  onClick={rerunSearchInCurrentMap}
                  disabled={loadingRooms || loadingMarkers}
                >
                  이 지도에서 다시 검색
                </button>
              ) : (
                <span className={styles.naturalModeBadge}>현재 지도 범위 적용됨</span>
              )}
            </div>
          )}

          {naturalError && <div className={styles.naturalError}>{naturalError}</div>}
        </form>

        {/* 기존 필터 패널은 그대로 유지합니다.
            자연어 검색은 이 패널을 대체하는 것이 아니라 보조 입력 방식입니다. */}
        <SearchFilterPanel
          cond={cond}
          handleCondChange={handleCondChange}
          handleOptionsChange={handleOptionsChange}
          clickSearch={clickSearch}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.left}>
          {showSemanticSection && (
            <section className={styles.semanticSection}>
              <div className={styles.semanticHeader}>
                <h3 className={styles.semanticTitle}>✨AI 추천 결과</h3>
                {semanticPreviewRooms.length > 0 && (
                  <span className={styles.semanticCount}>
                    AI 추천 {semanticPreviewRooms.length}건
                  </span>
                )}
              </div>

              {loadingNatural && (
                <div className={styles.semanticEmpty}>
                  자연어 검색 결과를 불러오는 중입니다.
                </div>
              )}

              {!loadingNatural &&
                naturalQuery.trim() &&
                semanticPreviewRooms.length === 0 &&
                !naturalError && (
                  <div className={styles.semanticEmpty}>추천 결과가 없습니다.</div>
                )}

              {/* 상단은 "의미 기반 추천" 결과입니다.
                  기존 하단 리스트와 같은 카드 컴포넌트를 재사용해 UI 일관성을 유지했습니다. */}
              {!loadingNatural &&
                semanticPreviewRooms.map((room) => (
                  <ResultItem
                    key={`semantic-${room.roomNo}`}
                    roomSearchResponse={room}
                    wished={!!wishMap?.[room.roomNo]}
                    onToggleWish={toggleWish}
                    onHoverHouseChange={setHoveredHouseNo}
                  />
                ))}
            </section>
          )}

          {/* 하단은 기존 필터 기반 결과 리스트입니다.
              자연어 검색을 하더라도 결국 이 영역은 기존 검색 API가 책임집니다. */}
          {showNormalSection && (
            <section className={styles.normalSection}>
              <div className={styles.normalHeader}>
                <h3 className={styles.normalTitle}>일반 검색 결과</h3>
                {!loadingRooms && rooms.length > 0 && (
                  <span className={styles.normalCount}>{rooms.length}건</span>
                )}
              </div>

              {!loadingRooms && rooms.length === 0 && (
                <div className={styles.normalEmpty}>
                  추출된 필터로 조회한 일반 검색 결과가 없습니다.
                </div>
              )}

              {rooms.length > 0 && (
                <ResultList
                  slice={rooms}
                  criterion={appliedCond?.criterion ?? cond.criterion}
                  onChangeCriterion={changeCriterion}
                  onLoadMore={onLoadMore}
                  hasNext={hasNext}
                  loading={loadingRooms}
                  wishMap={wishMap}
                  onToggleWish={toggleWish}
                  isJeonse={isJeonse}
                  onHoverHouseChange={setHoveredHouseNo}
                />
              )}
            </section>
          )}
        </div>

        <div className={styles.right}>
          <MapPanel
            markers={markers}
            loadingMarkers={loadingMarkers}
            onChangeBbox={handleChangeBbox}
            onMarkerClick={handleMarkerClick}
            popup={markerPopup}
            onClosePopup={closeMarkerPopup}
            hoveredHouseNo={hoveredHouseNo}
          />
        </div>
      </div>
    </div>
  );
}
