import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildUploadUrl } from '../../../app/config/env';

import styles from './Detail.module.css';

import HouseRoomsPreview from './../components/Detail/HouseRoomsPreview';
import TourApplyButton from './../components/Detail/TourApplyButton';
import ContractApplyButton from './../components/Detail/ContractApplyButton';
import { formatMoneyKRW } from './../components/Search/ResultItem';

import ImageGallery from './../components/Detail/ImageGallery';
import HouseInfoCard from './../components/Detail/HouseInfoCard';
import HouseMiniMap from './../components/Detail/HouseMiniMap';
import RoomOptionList from './../components/Detail/RoomOptionList';
import FacilityList from './../components/Detail/FacilityList';
import ReviewList from './../components/Detail/ReviewList';
import ScrollToTopButton from '../../../shared/components/ScrollToTopButton';
import { ROUTES } from '../../../shared/constants/routes';

import { useAuth } from '../../../app/providers/AuthProvider';

import {
  getRoom,
  getRoomImages,
  getRoomReviews,
  getSummarizedRoom,
  requestSummarizedRoom,
} from './../api/roomApi';
import { getHouse, getHouseImages, getRoomByHouseNo } from './../api/houseApi';
import {
  addWishlist,
  deleteWishlist,
  getWishlistByUser,
} from '../../wishlist/api/wishlistAPI';

const REVIEW_PAGE_SIZE = 5;

function pickImageName(x) {
  if (!x) return null;
  if (typeof x === 'string') return x;
  return x.roomStoredImageName || x.houseStoredImageName || null;
}

function toKrwText(value) {
  const money = formatMoneyKRW(value);
  return money ? `${money} 원` : '-';
}

function formatRoomLabel(roomName) {
  if (!roomName) return '';
  const text = String(roomName).trim();
  return text.endsWith('호') ? text : `${text}호`;
}

export default function Detail() {
  const navigate = useNavigate();
  const { isAuthed, userNo: currentUserNo } = useAuth();
  const { roomNo: routeRoomNo, houseNo: routeHouseNo } = useParams();
  const [selectedRoomNo, setSelectedRoomNo] = useState(routeRoomNo || '');
  const roomNameSectionRef = useRef(null);
  const shouldScrollToRoomRef = useRef(false);

  const [room, setRoom] = useState(null);
  const [house, setHouse] = useState(null);

  const [houseRooms, setHouseRooms] = useState([]);
  const [wishMap, setWishMap] = useState({});

  const [roomImageNames, setRoomImageNames] = useState([]);
  const [houseImageNames, setHouseImageNames] = useState([]);

  // 리뷰 페이지 번호와 페이지 데이터를 관리합니다.
  const [reviewPageNo, setReviewPageNo] = useState(0);
  const [reviewPage, setReviewPage] = useState(null);
  const [roomSummaryMap, setRoomSummaryMap] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [loading, setLoading] = useState(false);
  const activeHouseNo = routeHouseNo || room?.houseNo || '';
  const summaryRequestIdRef = useRef(0);
  const summaryPollTimeoutRef = useRef(null);
  const currentSummaryState = selectedRoomNo
    ? (roomSummaryMap[selectedRoomNo] ?? null)
    : null;
  const currentRoomSummary = currentSummaryState?.finalSummary || '';
  const hasCurrentRoomSummary = Boolean(currentRoomSummary);
  const isSummaryRefreshing =
    (currentSummaryState?.summaryStatus === 'PENDING' ||
      currentSummaryState?.summaryStatus === 'PROCESSING') &&
    hasCurrentRoomSummary;

  const refreshReviews = async () => {
    if (!selectedRoomNo) return;
    const page = await getRoomReviews(
      selectedRoomNo,
      reviewPageNo,
      REVIEW_PAGE_SIZE
    );
    setReviewPage(page);
  };

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

  async function toggleWish(roomNo, nextWished) {
    if (!currentUserNo) {
      alert('찜 기능은 로그인 후에만 사용할 수 있습니다.');
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
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

  useEffect(() => {
    loadWishlistMap();
  }, [currentUserNo]);

  useEffect(() => {
    setSelectedRoomNo(routeRoomNo || '');
    shouldScrollToRoomRef.current = false;
  }, [routeRoomNo]);

  useEffect(() => {
    if (!selectedRoomNo || !shouldScrollToRoomRef.current) return;
    roomNameSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    shouldScrollToRoomRef.current = false;
  }, [selectedRoomNo]);

  useEffect(() => {
    summaryRequestIdRef.current += 1;
    clearTimeout(summaryPollTimeoutRef.current);
    setSummaryLoading(false);
    setSummaryError('');

    if (!selectedRoomNo) return;

    loadRoomSummaryStatus(selectedRoomNo, summaryRequestIdRef.current);
  }, [selectedRoomNo]);

  useEffect(() => () => clearTimeout(summaryPollTimeoutRef.current), []);

  // 방 선택 시 방 정보, 이미지, 리뷰 첫 페이지를 다시 불러옵니다.
  useEffect(() => {
    if (!selectedRoomNo) {
      setRoom(null);
      setRoomImageNames([]);
      setReviewPage(null);
      setReviewPageNo(0);
      return;
    }

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

  // 리뷰 페이지가 바뀌면 해당 페이지를 다시 조회합니다.
  useEffect(() => {
    if (!selectedRoomNo) return;

    (async () => {
      const page = await getRoomReviews(
        selectedRoomNo,
        reviewPageNo,
        REVIEW_PAGE_SIZE
      );
      setReviewPage(page);
    })();
  }, [selectedRoomNo, reviewPageNo]);

  // houseNo가 준비되면 건물 정보와 방 목록을 불러옵니다.
  useEffect(() => {
    if (!activeHouseNo) {
      setHouse(null);
      setHouseRooms([]);
      setHouseImageNames([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [houseDto, roomsInHouse, houseImgs] = await Promise.all([
          getHouse(activeHouseNo),
          getRoomByHouseNo(activeHouseNo),
          getHouseImages(activeHouseNo),
        ]);

        if (cancelled) return;
        setHouse(houseDto);
        setHouseRooms(roomsInHouse || []);
        setHouseImageNames(
          (houseImgs || []).map(pickImageName).filter(Boolean)
        );
      } catch {
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeHouseNo]);

  function storeRoomSummary(roomNo, summaryState) {
    setRoomSummaryMap((prev) => ({
      ...prev,
      [roomNo]: summaryState || null,
    }));
  }

  function scheduleSummaryPoll(roomNo, requestId) {
    clearTimeout(summaryPollTimeoutRef.current);
    summaryPollTimeoutRef.current = setTimeout(() => {
      loadRoomSummaryStatus(roomNo, requestId);
    }, 2000);
  }

  async function loadRoomSummaryStatus(
    roomNo,
    requestId = summaryRequestIdRef.current
  ) {
    try {
      const summaryState = await getSummarizedRoom(roomNo);
      if (summaryRequestIdRef.current !== requestId) return;

      storeRoomSummary(roomNo, summaryState);

      const status = summaryState?.summaryStatus;
      if (status === 'PENDING' || status === 'PROCESSING') {
        setSummaryLoading(true);
        setSummaryError('');
        scheduleSummaryPoll(roomNo, requestId);
        return;
      }

      clearTimeout(summaryPollTimeoutRef.current);
      setSummaryLoading(false);
      setSummaryError(
        status === 'FAILED'
          ? summaryState?.lastErrorMessage ||
              'AI 방 정보 요약 생성에 실패했습니다.'
          : ''
      );
    } catch (e) {
      if (summaryRequestIdRef.current !== requestId) return;
      clearTimeout(summaryPollTimeoutRef.current);
      setSummaryLoading(false);
      setSummaryError(
        e.message || 'AI 방 정보 요약 상태를 불러오지 못했습니다.'
      );
    }
  }

  // 업로드 경로 기준으로 이미지 URL을 구성합니다.
  const houseImageUrls = useMemo(
    () =>
      houseImageNames
        .map((n) => buildUploadUrl('upload/house_image', n))
        .filter(Boolean),
    [houseImageNames]
  );
  const roomImageUrls = useMemo(
    () =>
      roomImageNames
        .map((n) => buildUploadUrl('upload/room_image', n))
        .filter(Boolean),
    [roomImageNames]
  );
  const canApplyTour = room?.canTourApply !== false;
  const canApplyContract = room?.canContractApply !== false;
  const occupancyEndDateText = room?.occupancyEndDate ?? '';

  function onSelectRoom(nextRoomNo) {
    if (String(nextRoomNo) === String(selectedRoomNo)) {
      roomNameSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }
    shouldScrollToRoomRef.current = true;
    setSelectedRoomNo(nextRoomNo);
    // 필요하면 추후 라우팅도 함께 갱신할 수 있습니다.
  }

  function handleRequireLoginForWish() {
    alert('찜 기능은 로그인 후에만 사용할 수 있습니다.');
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  }

  async function handleLoadRoomSummary() {
    if (!selectedRoomNo || summaryLoading) return;

    const requestRoomNo = selectedRoomNo;
    const requestId = summaryRequestIdRef.current + 1;
    let shouldKeepPolling = false;
    summaryRequestIdRef.current = requestId;
    clearTimeout(summaryPollTimeoutRef.current);

    setSummaryLoading(true);
    setSummaryError('');

    try {
      const summary = await requestSummarizedRoom(requestRoomNo);
      if (summaryRequestIdRef.current !== requestId) return;

      storeRoomSummary(requestRoomNo, summary);

      const status = summary?.summaryStatus;
      if (status === 'DONE') {
        setSummaryLoading(false);
        setSummaryError('');
        return;
      }

      if (status === 'FAILED') {
        setSummaryLoading(false);
        setSummaryError(
          summary?.lastErrorMessage || 'AI 방 정보 요약 생성에 실패했습니다.'
        );
        return;
      }

      scheduleSummaryPoll(requestRoomNo, requestId);
      shouldKeepPolling = true;
    } catch (e) {
      if (summaryRequestIdRef.current !== requestId) return;
      clearTimeout(summaryPollTimeoutRef.current);
      setSummaryError(e.message || 'AI 방 정보 요약 요청에 실패했습니다.');
    } finally {
      if (summaryRequestIdRef.current === requestId && !shouldKeepPolling) {
        setSummaryLoading(false);
      }
    }
  }

  return (
    <div className={styles.wrap}>
      {/* 좌측 사이드바 */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSticky}>
          <div className={styles.roomListWrap}>
            <HouseRoomsPreview
              rooms={houseRooms}
              selectedRoomNo={selectedRoomNo}
              onSelect={onSelectRoom}
              wishMap={wishMap}
              onToggleWish={toggleWish}
              isAuthed={isAuthed}
              onRequireLogin={handleRequireLoginForWish}
            />
          </div>

          <div className={styles.sideButtons}>
            <TourApplyButton roomNo={selectedRoomNo} disabled={!canApplyTour} />
            <ContractApplyButton
              roomNo={selectedRoomNo}
              disabled={!canApplyContract}
            />
            {room?.roomEmptyYn === false &&
              canApplyTour &&
              occupancyEndDateText && (
                <div className={styles.applyHint}>
                  현재 거주중인 방이지만 계약 종료 1개월 전 기간으로,{' '}
                  {occupancyEndDateText} 이후 입주 기준으로 투어/입주 신청이
                  가능합니다.
                </div>
              )}
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className={styles.main}>
        {!activeHouseNo && (
          <div className={styles.empty}>좌측 목록에서 방을 선택하세요.</div>
        )}

        {activeHouseNo && (
          <>
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.title}>
                  {house?.houseName ?? '상세보기'}
                </h2>
                <div className={styles.subTitle}>
                  {house?.houseAddress ?? ''} {house?.houseAddressDetail ?? ''}
                </div>
              </div>
              {loading && <div className={styles.loading}>불러오는 중...</div>}
            </div>

            {/* 1) 건물 이미지 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>건물 사진</h3> */}
              <ImageGallery images={houseImageUrls} />
            </section>

            {/* 2) 건물 정보 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>{house?.houseName}</h3> */}
              <HouseInfoCard house={house} />
            </section>

            {/* 3) 방 위치 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>방 위치</h3>
              <HouseMiniMap lat={house?.houseLat} lng={house?.houseLng} />
            </section>

            {/* 4) 공용시설 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>공용시설</h3>
              <FacilityList houseNo={house?.houseNo || activeHouseNo} />
            </section>

            {!selectedRoomNo && (
              <div className={styles.empty}>좌측 목록에서 방을 선택하세요.</div>
            )}

            {selectedRoomNo && (
              <>
                <section className={styles.section} ref={roomNameSectionRef}>
                  <br />
                  <br />
                  <h3 className={styles.sectionTitle}>
                    {formatRoomLabel(room?.roomName)}
                  </h3>
                </section>

                <section className={styles.section}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                      <div className={styles.summaryHeadingBlock}>
                        <h4 className={styles.summaryTitle}>AI 방 정보 요약</h4>
                        <p className={styles.summaryHint}>
                          방 기본 정보, 사진 요약, 리뷰 요약을 묶어서 AI가 한
                          번에 정리해드립니다.
                        </p>
                      </div>

                      <button
                        type="button"
                        className={styles.summaryButton}
                        onClick={handleLoadRoomSummary}
                        disabled={!selectedRoomNo || summaryLoading}
                      >
                        {summaryLoading
                          ? '요약 생성 중...'
                          : currentSummaryState?.summaryStatus === 'DONE' &&
                              currentRoomSummary
                            ? 'AI 방 정보 요약 다시 불러오기'
                            : 'AI 방 정보 요약'}
                      </button>
                    </div>

                    {summaryLoading && !hasCurrentRoomSummary && (
                      <div
                        className={styles.summaryLoading}
                        role="status"
                        aria-live="polite"
                      >
                        <span
                          className={styles.summarySpinner}
                          aria-hidden="true"
                        />
                        <span>AI가 방 정보를 요약하는 중입니다...</span>
                      </div>
                    )}

                    {!summaryLoading && summaryError && (
                      <div className={styles.summaryError}>{summaryError}</div>
                    )}

                    {!summaryError && hasCurrentRoomSummary && (
                      <>
                        {isSummaryRefreshing && (
                          <div className={styles.summaryRefreshing}>
                            이전 요약입니다. 최신 리뷰를 반영해 AI가 다시
                            생각중입니다.
                          </div>
                        )}
                        <div className={styles.summaryResult}>
                          {currentRoomSummary}
                        </div>
                      </>
                    )}

                    {!summaryLoading &&
                      !summaryError &&
                      !hasCurrentRoomSummary && (
                        <div className={styles.summaryPlaceholder}>
                          버튼을 누르면 현재 방의 종합 요약 결과를 여기에서
                          확인할 수 있습니다.
                        </div>
                      )}
                  </div>
                </section>

                {/* 5) 방 이미지 */}
                <section className={styles.section}>
                  {/* <h3 className={styles.sectionTitle}>방 사진</h3> */}
                  <ImageGallery images={roomImageUrls} />
                </section>

                {/* 6) 방 정보 */}
                <section className={styles.section}>
                  {/* <h3 className={styles.sectionTitle}>방 정보</h3> */}
                  <div className={styles.infoGrid}>
                    {/* <div>호수: {room?.roomName ?? '-'}</div> */}
                    <div>
                      상태: {room?.roomEmptyYn ? '공실' : '거주중'}
                    </div>
                    <div>
                      거래 종류:{' '}
                      {room?.roomMethod == 'L'
                        ? '전세'
                        : room?.roomMethod == 'M'
                          ? '월세'
                          : '-'}
                    </div>
                    <div>보증금: {toKrwText(room?.roomDeposit)}</div>
                    <div>월세: {toKrwText(room?.roomMonthly)}</div>
                    <div>면적: {room?.roomArea ?? '-'}</div>
                    <div>방향: {room?.roomFacing ?? '-'}</div>
                    <div>방 개수: {room?.roomRoomCount ?? '-'}</div>
                    <div>욕실 수: {room?.roomBathCount ?? '-'}</div>
                    <div>입주가능일: {room?.roomAvailableDate ?? '-'}</div>
                  </div>

                  <div className={styles.abstractBox}>
                    {room?.roomAbstract || '공개 내용이 없습니다.'}
                  </div>
                </section>

                {/* 7) 방 옵션 */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>방 옵션</h3>
                  <RoomOptionList options={room?.roomOptions} />
                </section>

                {/* 8) 리뷰 */}
                <section className={styles.section}>
                  <br />
                  <br />
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
          </>
        )}
      </main>
      <ScrollToTopButton />
    </div>
  );
}
