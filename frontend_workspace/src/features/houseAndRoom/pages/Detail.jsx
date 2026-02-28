import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import styles from './Detail.module.css';

import HouseRoomsPreview from './../components/Detail/HouseRoomsPreview';
import TourApplyButton from './../components/Detail/TourApplyButton';
import ContractApplyButton from './../components/Detail/ContractApplyButton';

import ImageGallery from './../components/Detail/ImageGallery';
import HouseInfoCard from './../components/Detail/HouseInfoCard';
import HouseMiniMap from './../components/Detail/HouseMiniMap';
import RoomOptionList from './../components/Detail/RoomOptionList';
import FacilityList from './../components/Detail/FacilityList';
import ReviewList from './../components/Detail/ReviewList';

import { useAuth } from '../../../app/providers/AuthProvider';

import { getRoom, getRoomImages, getRoomReviews } from './../api/roomApi';
import { getHouse, getHouseImages, getRoomByHouseNo } from './../api/houseApi';

const REVIEW_PAGE_SIZE = 5;

function pickImageName(x) {
  if (!x) return null;
  if (typeof x === 'string') return x;
  return (
    x.roomStoredImageName ||
    x.houseStoredImageName ||
    null
  );
}

function toUrl(base, name) {
  if (!name) return null;
  if (name.startsWith('http')) return name;
  return `${base}/${name}`;
}

export default function Detail() {
  const { userNo: currentUserNo } = useAuth();
  const { roomNo: routeRoomNo } = useParams();
  const [selectedRoomNo, setSelectedRoomNo] = useState(routeRoomNo || '');

  const [room, setRoom] = useState(null);
  const [house, setHouse] = useState(null);

  const [houseRooms, setHouseRooms] = useState([]);

  const [roomImageNames, setRoomImageNames] = useState([]);
  const [houseImageNames, setHouseImageNames] = useState([]);

  // 리뷰는 Page로 오고, 숫자 페이지네이션
  const [reviewPageNo, setReviewPageNo] = useState(0);
  const [reviewPage, setReviewPage] = useState(null);

  const [loading, setLoading] = useState(false);

  const refreshReviews = async () => {
    if (!selectedRoomNo) return;
    const page = await getRoomReviews(selectedRoomNo, reviewPageNo, REVIEW_PAGE_SIZE);
    setReviewPage(page);
  };

  useEffect(() => {
    if (routeRoomNo) setSelectedRoomNo(routeRoomNo);
  }, [routeRoomNo]);

  // 방 선택 → 방/방이미지 로드 + 리뷰 0페이지
  useEffect(() => {
    if (!selectedRoomNo) return;

    (async () => {
      setLoading(true);
      try {
        const roomDto = await getRoom(selectedRoomNo);
        setRoom(roomDto);

        const roomImgs = await getRoomImages(selectedRoomNo);
        const names = (roomImgs || []).map(pickImageName).filter(Boolean);
        setRoomImageNames(names);

        setReviewPageNo(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRoomNo]);

  // 리뷰 페이지 변경 → 재조회
  useEffect(() => {
    if (!selectedRoomNo) return;

    (async () => {
      const page = await getRoomReviews(selectedRoomNo, reviewPageNo, REVIEW_PAGE_SIZE);
      setReviewPage(page);
    })();
  }, [selectedRoomNo, reviewPageNo]);

  // houseNo가 준비되면 건물 관련 로드
  useEffect(() => {
    if (!room?.houseNo) return;

    (async () => {
      try {
        // console.log(room.houseNo)
        const [houseDto, roomsInHouse, houseImgs] = await Promise.all([
          getHouse(room.houseNo),
          getRoomByHouseNo(room.houseNo),
          getHouseImages(room.houseNo),
        ]);
        // console.log(houseImgs)

        setHouse(houseDto);
        setHouseRooms(roomsInHouse || []);
        setHouseImageNames((houseImgs || []).map(pickImageName).filter(Boolean));
      } catch {
        // 추후 에러 처리
      }
    })();
  }, [room?.houseNo]);

  // 업로드 경로(UploadProperties 기준)
  const houseImageUrls = useMemo(
    () => houseImageNames.map((n) => toUrl(`http://localhost:8080/upload/house_image`, n)).filter(Boolean),
    [houseImageNames]
  );
  const roomImageUrls = useMemo(
    () => roomImageNames.map((n) => toUrl(`http://localhost:8080/upload/room_image`, n)).filter(Boolean),
    [roomImageNames]
  );

  function onSelectRoom(nextRoomNo) {
    setSelectedRoomNo(nextRoomNo);
    // 라우트 작업 이후: navigate(`/rooms/${nextRoomNo}`)
  }

  return (
    <div className={styles.wrap}>
      {/* 좌측 */}
      <aside className={styles.sidebar}>
        <HouseRoomsPreview rooms={houseRooms} selectedRoomNo={selectedRoomNo} onSelect={onSelectRoom} />

        <div className={styles.sideButtons}>
          <TourApplyButton roomNo={selectedRoomNo} />
          <ContractApplyButton roomNo={selectedRoomNo} />
        </div>
      </aside>

      {/* 중앙~우측 */}
      <main className={styles.main}>
        {!selectedRoomNo && <div className={styles.empty}>왼쪽 목록에서 방을 선택하세요.</div>}

        {selectedRoomNo && (
          <>
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.title}>{house?.houseName ?? '상세보기'}</h2>
                <div className={styles.subTitle}>
                  {house?.houseAddress ?? ''} {house?.houseAddressDetail ?? ''}
                </div>
              </div>
              {loading && <div className={styles.loading}>불러오는 중…</div>}
            </div>

            {/* 1) 건물이미지 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>건물 사진</h3> */}
              <ImageGallery images={houseImageUrls} />
            </section>

            {/* 2) 건물정보 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>{house?.houseName}</h3> */}
              <HouseInfoCard house={house} />
            </section>

            {/* 3) 작은지도(주변 아이콘은 숨김) */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>📍 위치</h3>
              <HouseMiniMap lat={house?.houseLat} lng={house?.houseLng} />
            </section>

            <section className={styles.section}>
              <br/>
              <br/>
              <h3 className={styles.sectionTitle}>🛋️ {room?.roomName}</h3>
            </section>

            {/* 4) 방이미지 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>방 사진</h3> */}
              <ImageGallery images={roomImageUrls} />
            </section>

            {/* 5) 방정보 (공실여부 포함) */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>방 정보</h3> */}
              <div className={styles.infoGrid}>
                {/* <div>🛋️ 호실: {room?.roomName ?? '-'}</div> */}
                <div>🔑 공실여부: {room?.roomEmptyYn ? '공실' : '거주중'}</div>
                <div>✍️ 거래: {(room?.roomMethod == 'L' ? '전세' : (room?.roomMethod == 'M' ? '월세' : '-'))}</div>
                <div>💰 보증금: {room?.roomDeposit ?? '-'}</div>
                <div>💰 월세: {room?.roomMonthly ?? '-'}</div>
                <div>📐 면적: {room?.roomArea ?? '-'}</div>
                <div>🧭 방향: {room?.roomFacing ?? '-'}</div>
                <div>🛏️ 방 수: {room?.roomRoomCount ?? '-'}</div>
                <div>🚽 욕실 수: {room?.roomBathCount ?? '-'}</div>
                <div>📆 입주가능일: {room?.roomAvailableDate ?? '-'}</div>
              </div>

              <div className={styles.abstractBox}>{room?.roomAbstract || '소개 내용이 없습니다.'}</div>
            </section>

            {/* 6) 방옵션 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>방 옵션</h3>
              <RoomOptionList options={room?.roomOptions} />
            </section>

            {/* 7) 공용시설 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>공용시설</h3>
              <FacilityList houseNo={room?.houseNo} />
            </section>

            {/* 8) 리뷰(Page + 숫자 페이지네이션) */}
            <section className={styles.section}>
              <br/>
              <br/>
              {/* <h3 className={styles.sectionTitle}>리뷰</h3> */}
              <ReviewList
                page={reviewPage}
                currentUserNo={currentUserNo}
                roomNo={selectedRoomNo}
                onChangePage={setReviewPageNo}
                onRefresh={refreshReviews}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
