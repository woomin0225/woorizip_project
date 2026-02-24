import { useState } from 'react';
import SearchFilterPanel from './../components/Search/SearchFilterPanel';
import MapPanel from '../components/Search/MapPanel';
import ResultList from './../components/Search/ResultList';
import styles from './Search.module.css';

import { searchRooms } from '../api/roomApi';
import { getHouseMarkers } from '../api/houseApi';
import { getRoomsInHouseMarker } from "../api/houseApi";

const PAGE_SIZE = 10;

export default function Search() {
  const initialCond = {
    keyword: '',
    roomType: '',
    minDeposit: null,
    maxDeposit: null,
    minTax: null,
    maxTax: null,
    // 서울역 중심으로 기본 설정
    swLat: 37.54121,
    swLng: 126.95368,
    neLat: 37.56819,
    neLng: 126.98772,
    options: "",
    roomRoomCount: 1,
    houseElevatorYn: true,
    housePetYn: false,
    houseFemaleLimit: false,
    houseParking: true,
    criterion: 'LATEST',
  }

  // 입력용(검색 안 함)
  const [cond, setCond] = useState(initialCond);

  // 마지막으로 “검색 버튼/정렬 버튼”으로 확정된 조건(검색에만 사용)
  const [appliedCond, setAppliedCond] = useState(null);

  // bounding box 정보 (MapPanel의 남서, 북동 위도/경도)
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
  // 로딩 - 더보기 진행중 여부
  const [loading, setLoading] = useState(false);
  // 로딩 - 지도 건물 마커 처리중 여부
  const [loadingMarkers, setLoadingMarkers] = useState();
  const [wishMap, setWishMap] = useState({}); 
  // { [roomNo]: true/false }  // 나중에 API 붙히기

  const [markerPopup, setMarkerPopup] = useState(null);
  // null or { houseNo, lat, lng, rooms: RoomSearchResponse[] }

  // =============================================================================================

  // cond 처리 핸들러
  const handleCondChange = (event) => {
    const name = event.target.name;
    const type = event.target.type;
    const value = event.target.value;
    const checked = event.target.checked;

    setCond(current=>{
      if(type==="checkbox"){
        return {...current, [name]:checked};
      }

      const numberFields = new Set(["minDeposit", "maxDeposit", "minTax", "maxTax", "roomRoomCount", "swLat", "swLng", "neLat", "neLng",]);
      if(numberFields.has(name)){
        return {...current, [name]:value === "" || value === null ? null : Number(value)}
      }

      return {...current, [name]:value}
    });
  };

  // cond의 옵션 전용 처리 핸들러
  const handleOptionsChange = (event) => {
    const value = event.target.value;
    const checked = event.target.checked;
    
    setCond(current=>{
      // 현재 옵션 문자열을 배열로 만들기
      let arr = (current.options || "").split(",").filter(v=>v!=="");

      // 체크된 옵션을 배열에 추가 | 체크 해제하면 배열에서 삭제
      if(checked){
        // 중복 확인하고 추가하기
        if(!arr.includes(value)) arr.push(value);
      }else{
        arr = arr.filter(v=>v!=value);
      }

      // 다시 문자열로 전환하기
      return {
        ...current, options: arr.join(",")
      };
    });
  };

  // 검색: 첫 페이지
    async function runSearch(firstCond, firstBbox) {
    setLoadingRooms(true);
    setLoadingMarkers(true);
    setMarkerPopup(null);

    try {
      const merged = { ...firstCond, ...firstBbox };

      const [slice, markerList] = await Promise.all([
        searchRooms(merged, 0, PAGE_SIZE), // Slice<RoomSearchResponse>
        getHouseMarkers(merged),           // List<HouseMarkerResponse>
      ]);

      const content = slice?.content ?? [];
      setRooms(content);
      setMarkers(markerList ?? []);

      setPage(slice?.number ?? 0);
      setHasNext(typeof slice?.hasNext === 'boolean' ? slice.hasNext : !slice?.last);
    } finally {
      setLoadingRooms(false);
      setLoadingMarkers(false);
    }
  }

  // 검색 버튼(필터 입력 중에는 호출 안 됨)
  const clickSearch = () => {
    const nextApplied = { ...cond };
    setAppliedCond(nextApplied);
    runSearch(nextApplied, bbox);
  };

  // 정렬 버튼도 “검색”이므로: appliedCond 갱신 후 재검색(마커도 같이 갱신)
  const changeCriterion = (nextCriterion) => {
    setCond((c) => ({ ...c, criterion: nextCriterion }));

    const base = appliedCond ? appliedCond : cond;
    const nextApplied = { ...base, criterion: nextCriterion };

    setAppliedCond(nextApplied);
    runSearch(nextApplied, bbox);
  };

  // 지도 이동/줌 때 bbox가 바뀌면 호출됨 (검색을 한번이라도 한 뒤에만 재검색)
  const handleChangeBbox = (nextBbox) => {
    setBbox(nextBbox);

    if (!appliedCond) return; // 아직 검색 버튼을 안 눌렀으면 재검색 X
    runSearch(appliedCond, nextBbox);
  };

  // 더보기(목록만 누적)
  const clickMore = async () => {
    setMarkerPopup(null);
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
      setHasNext(typeof slice?.hasNext === 'boolean' ? slice.hasNext : !slice?.last);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 찜하기
  function toggleWish(roomNo, nextWished) {
    setWishMap((prev) => ({ ...prev, [roomNo]: nextWished }));
    // 찜 API 붙히기
  };

  // 마커 클릭시 방 목록 출력
  async function handleMarkerClick(house) {
    // house: { houseNo, houseLat, houseLng }
    // 기존 팝업 닫고 새로 열기
    setMarkerPopup(null);

    const roomsInHouse = await getRoomsInHouseMarker(house.houseNo);
    setMarkerPopup({
      houseNo: house.houseNo,
      lat: house.houseLat,
      lng: house.houseLng,
      rooms: roomsInHouse || [],
    });
  };

  function closeMarkerPopup() {
    setMarkerPopup(null);
  }


  return (
    <div>
      <SearchFilterPanel
        cond={cond}
        handleCondChange={handleCondChange}
        handleOptionsChange={handleOptionsChange}
        clickSearch={clickSearch}
      />
      <ResultList
        slice={rooms}
        criterion={appliedCond?.criterion ?? cond.criterion}
        onChangeCriterion={changeCriterion}
        clickMore={clickMore}
        hasNext={hasNext}
        loading={loadingRooms}
        wishMap={wishMap}
        onToggleWish={toggleWish}
      />
      {/* 리스트에 검색결과 더보기할 때마다 누적시키기 */}
      <MapPanel
          markers={markers}
          loadingMarkers={loadingMarkers}
          onChangeBbox={handleChangeBbox}
          onMarkerClick={handleMarkerClick}
          popup={markerPopup}
          onClosePopup={closeMarkerPopup}
      />
    </div>
  );
}
