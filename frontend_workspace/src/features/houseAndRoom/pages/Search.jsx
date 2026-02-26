// import { useState } from 'react';
import { useEffect, useMemo, useState } from 'react';
import SearchFilterPanel from './../components/Search/SearchFilterPanel';
import MapPanel from '../components/Search/MapPanel';
import ResultList from './../components/Search/ResultList';

import { searchRooms } from '../api/roomApi';
import { getHouseMarkers, getRoomsInHouseMarker } from '../api/houseApi';
import { parseJwt } from '../../../app/providers/utils/jwt';
import {
  addWishlist,
  deleteWishlist,
  getWishlistByUser,
} from '../../wishlist/api/wishlistAPI';

import styles from './Search.module.css';

const PAGE_SIZE = 10;

function getCurrentUserNo() {
  const fromStorage =
    localStorage.getItem('userNo') || localStorage.getItem('userId');
  if (fromStorage) return fromStorage;

  const raw = localStorage.getItem('accessToken');
  if (!raw) return null;
  let token = String(raw).trim();
  if (token.startsWith('"') && token.endsWith('"'))
    token = token.slice(1, -1).trim();
  if (token.startsWith('Bearer ')) token = token.slice('Bearer '.length).trim();
  if (!token || token === 'null' || token === 'undefined') return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return payload.userNo || payload.userId || null;
}

export default function Search() {
  const initialCond = {
    keyword: '',
    roomType: '',
    minDeposit: null,
    maxDeposit: null,
    minTax: null,
    maxTax: null,

    // 서울역 중심 기본 bbox
    swLat: 37.54121,
    swLng: 126.95368,
    neLat: 37.56819,
    neLng: 126.98772,

    options: '',
    roomRoomCount: 1,
    houseElevatorYn: true,
    housePetYn: false,
    houseFemaleLimit: false,
    houseParking: true,
    criterion: 'LATEST',
  };

  // 입력용(검색 안 함)
  const [cond, setCond] = useState(initialCond);

  // 마지막으로 “검색 버튼/정렬 버튼”으로 확정된 조건(검색에만 사용)
  const [appliedCond, setAppliedCond] = useState(null);

  // bounding box
  const [bbox, setBbox] = useState({
    swLat: initialCond.swLat,
    swLng: initialCond.swLng,
    neLat: initialCond.neLat,
    neLng: initialCond.neLng,
  });

  // 검색 결과 - 방 목록
  const [rooms, setRooms] = useState([]);
  // 검색 결과 - 지도 건물 마커
  const [markers, setMarkers] = useState([]);
  // 슬라이스 상태 - 더보기용 타겟 페이지
  const [page, setPage] = useState(0);
  // 슬라이스 상태 - 더보기 가능여부
  const [hasNext, setHasNext] = useState(true);
  // 로딩 상태
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  // 찜(로컬)
  // const [wishMap, setWishMap] = useState({}); // { [roomNo]: true/false }
  // 찜(서버 연동)
  const currentUserNo = useMemo(() => getCurrentUserNo(), []);
  const [wishMap, setWishMap] = useState({}); // { [roomNo]: wishNo }

  // 마커 팝업 (마커 위 미니 리스트)
  const [markerPopup, setMarkerPopup] = useState(null);
  // null or { houseNo, lat, lng, rooms: RoomSearchResponse[] }

  function buildWishMap(list) {
    const map = {};
    (list || []).forEach((item) => {
      if (!item?.roomNo) return;
      map[item.roomNo] = item.wishNo || true;
    });
    return map;
  }

  async function loadWishlistMap() {
    if (!currentUserNo) {
      setWishMap({});
      return;
    }

    try {
      const list = await getWishlistByUser(currentUserNo, 1, 200);
      setWishMap(buildWishMap(list));
    } catch {
      setWishMap({});
    }
  }

  useEffect(() => {
    loadWishlistMap();
  }, [currentUserNo]);

  // =========================
  // 입력 핸들러(검색 X)
  const handleCondChange = (event) => {
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
        return {
          ...current,
          [name]: value === '' || value === null ? null : Number(value),
        };
      }
      return { ...current, [name]: value };
    });
  };

  // cond의 옵션 전용 처리 핸들러
  const handleOptionsChange = (event) => {
    const value = event.target.value;
    const checked = event.target.checked;

    setCond((current) => {
      // 현재 옵션 문자열을 배열로 만들기
      let arr = (current.options || '').split(',').filter((v) => v !== '');
      // 체크된 옵션을 배열에 추가 | 체크 해제하면 배열에서 삭제
      if (checked) {
        // 중복 확인하고 추가하기
        if (!arr.includes(value)) arr.push(value);
      } else {
        arr = arr.filter((v) => v !== value);
      }

      // 다시 문자열로 전환하기
      return { ...current, options: arr.join(',') };
    });
  };

  // =========================
  // 검색(첫 페이지) : 목록 + 마커
  async function runSearch(firstCond, firstBbox) {
    setLoadingRooms(true);
    setLoadingMarkers(true);
    setMarkerPopup(null); // 검색 시작하면 팝업 닫기

    try {
      const merged = { ...firstCond, ...firstBbox };

      const [slice, markerList] = await Promise.all([
        searchRooms(merged, 0, PAGE_SIZE), // Slice<RoomSearchResponse>
        getHouseMarkers(merged), // List<HouseMarkerResponse>
      ]);

      setRooms(slice?.content ?? []);
      setMarkers(markerList ?? []);

      setPage(slice?.number ?? 0);
      setHasNext(
        typeof slice?.hasNext === 'boolean' ? slice.hasNext : !slice?.last
      );
    } finally {
      setLoadingRooms(false);
      setLoadingMarkers(false);
    }
  }

  // 검색 버튼
  const clickSearch = () => {
    const nextApplied = { ...cond };
    setAppliedCond(nextApplied);
    runSearch(nextApplied, bbox);
  };

  // 정렬 버튼도 검색 트리거
  const changeCriterion = (nextCriterion) => {
    setCond((c) => ({ ...c, criterion: nextCriterion }));

    const base = appliedCond ? appliedCond : cond;
    const nextApplied = { ...base, criterion: nextCriterion };

    setAppliedCond(nextApplied);
    runSearch(nextApplied, bbox);
  };

  // 지도 bbox 변경: 검색한 뒤(appliedCond 있을 때)만 재검색
  const handleChangeBbox = (nextBbox) => {
    setBbox(nextBbox);

    if (!appliedCond) return;
    runSearch(appliedCond, nextBbox);
  };

  // 더보기 (목록만 누적)
  const onLoadMore = async () => {
    setMarkerPopup(null); // 더보기도 팝업 닫기
    if (!appliedCond) return;
    if (loadingRooms || !hasNext) return;

    setLoadingRooms(true);
    try {
      const nextPage = page + 1;
      const merged = { ...appliedCond, ...bbox };

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

  // 찜 토글(로컬)
  // function toggleWish(roomNo, nextWished) {
  //   setWishMap((prev) => ({ ...prev, [roomNo]: nextWished }));
  //   // 추후 찜 API 붙이면 여기서 호출
  // }
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

  // 마커 클릭: 해당 house 방 목록을 “작게” 띄우기
  async function handleMarkerClick(house) {
    // 기존 팝업 닫고 새로 열기
    setMarkerPopup(null);

    // 필터 반영하고 싶으면 appliedCond 우선
    const base = appliedCond ?? cond;

    // getRoomsInHouseMarker가 Slice를 주든 List를 주든 대응
    const slice = await getRoomsInHouseMarker(house.houseNo, base, 0, 10);
    const list = slice?.content ?? [];

    setMarkerPopup({
      houseNo: house.houseNo,
      lat: house.houseLat,
      lng: house.houseLng,
      rooms: list,
    });
  }

  function closeMarkerPopup() {
    setMarkerPopup(null);
  }

  return (
    <div className={styles.page}>
      {/* 상단: 필터(가로 한 줄로 만들 영역) */}
      <div className={styles.top}>
        <SearchFilterPanel
          cond={cond}
          handleCondChange={handleCondChange}
          handleOptionsChange={handleOptionsChange}
          clickSearch={clickSearch}
        />
      </div>

      {/* 본문: 좌(리스트) + 우(지도) */}
      <div className={styles.body}>
        <div className={styles.left}>
          <ResultList
            slice={rooms}
            criterion={appliedCond?.criterion ?? cond.criterion}
            onChangeCriterion={changeCriterion}
            onLoadMore={onLoadMore}
            hasNext={hasNext}
            loading={loadingRooms}
            wishMap={wishMap}
            onToggleWish={toggleWish}
          />
        </div>

        <div className={styles.right}>
          <MapPanel
            markers={markers}
            loadingMarkers={loadingMarkers}
            onChangeBbox={handleChangeBbox}
            onMarkerClick={handleMarkerClick}
            popup={markerPopup}
            onClosePopup={closeMarkerPopup}
          />
        </div>
      </div>
    </div>
  );
}
