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

  // 由щ럭??Page濡??ㅺ퀬, ?レ옄 ?섏씠吏?ㅼ씠??
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
      alert('李?湲곕뒫? 濡쒓렇?????ъ슜?????덉뒿?덈떎.');
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
      alert(e.message || '李?泥섎━???ㅽ뙣?덉뒿?덈떎.');
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

  // 諛??좏깮 -> 諛?諛⑹씠誘몄? 濡쒕뱶 + 由щ럭 0?섏씠吏
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

  // 由щ럭 ?섏씠吏 蹂寃?-> ?ъ“??
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

  // houseNo媛 以鍮꾨릺硫?嫄대Ъ 愿??濡쒕뱶
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
              'AI 諛??뺣낫 ?붿빟 ?앹꽦???ㅽ뙣?덉뒿?덈떎.'
          : ''
      );
    } catch (e) {
      if (summaryRequestIdRef.current !== requestId) return;
      clearTimeout(summaryPollTimeoutRef.current);
      setSummaryLoading(false);
      setSummaryError(
        e.message || 'AI 諛??뺣낫 ?붿빟 ?곹깭瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??'
      );
    }
  }

  // ?낅줈??寃쎈줈(UploadProperties 湲곗?)
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
    // ?쇱슦???묒뾽 ?댄썑: navigate(`/rooms/${nextRoomNo}`)
  }

  function handleRequireLoginForWish() {
    alert('李?湲곕뒫? 濡쒓렇?????ъ슜?????덉뒿?덈떎.');
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
          summary?.lastErrorMessage || 'AI 諛??뺣낫 ?붿빟 ?앹꽦???ㅽ뙣?덉뒿?덈떎.'
        );
        return;
      }

      scheduleSummaryPoll(requestRoomNo, requestId);
      shouldKeepPolling = true;
    } catch (e) {
      if (summaryRequestIdRef.current !== requestId) return;
      clearTimeout(summaryPollTimeoutRef.current);
      setSummaryError(e.message || 'AI 諛??뺣낫 ?붿빟 ?앹꽦 ?붿껌???ㅽ뙣?덉뒿?덈떎.');
    } finally {
      if (summaryRequestIdRef.current === requestId && !shouldKeepPolling) {
        setSummaryLoading(false);
      }
    }
  }

  return (
    <div className={styles.wrap}>
      {/* 醫뚯륫 */}
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
                  ?꾩옱 嫄곗＜以묒씤 諛⑹씠吏留?怨꾩빟 醫낅즺 1媛쒖썡 ??湲곌컙?쇰줈,{' '}
                  {occupancyEndDateText} ?댄썑 ?낆＜ 湲곗??쇰줈 ?ъ뼱/?낆＜ ?좎껌??
                  媛?ν빀?덈떎.
                </div>
              )}
          </div>
        </div>
      </aside>

      {/* 以묒븰~?곗륫 */}
      <main className={styles.main}>
        {!activeHouseNo && (
          <div className={styles.empty}>?쇱そ 紐⑸줉?먯꽌 諛⑹쓣 ?좏깮?섏꽭??</div>
        )}

        {activeHouseNo && (
          <>
            <div className={styles.headerRow}>
              <div>
                <h2 className={styles.title}>
                  {house?.houseName ?? '?곸꽭蹂닿린'}
                </h2>
                <div className={styles.subTitle}>
                  {house?.houseAddress ?? ''} {house?.houseAddressDetail ?? ''}
                </div>
              </div>
              {loading && <div className={styles.loading}>불러오는 중...</div>}
            </div>

            {/* 1) 嫄대Ъ?대?吏 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>嫄대Ъ ?ъ쭊</h3> */}
              <ImageGallery images={houseImageUrls} />
            </section>

            {/* 2) 嫄대Ъ?뺣낫 */}
            <section className={styles.section}>
              {/* <h3 className={styles.sectionTitle}>{house?.houseName}</h3> */}
              <HouseInfoCard house={house} />
            </section>

            {/* 3) ?묒?吏??二쇰? ?꾩씠肄섏? ?④?) */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>?뱧 ?꾩튂</h3>
              <HouseMiniMap lat={house?.houseLat} lng={house?.houseLng} />
            </section>

            {/* 4) 怨듭슜?쒖꽕 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>怨듭슜?쒖꽕</h3>
              <FacilityList houseNo={house?.houseNo || activeHouseNo} />
            </section>

            {!selectedRoomNo && (
              <div className={styles.empty}>?쇱そ 紐⑸줉?먯꽌 諛⑹쓣 ?좏깮?섏꽭??</div>
            )}

            {selectedRoomNo && (
              <>
                <section className={styles.section} ref={roomNameSectionRef}>
                  <br />
                  <br />
                  <h3 className={styles.sectionTitle}>?썘截?{room?.roomName}</h3>
                </section>

                <section className={styles.section}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                      <div className={styles.summaryHeadingBlock}>
                        <h4 className={styles.summaryTitle}>AI 諛??뺣낫 ?붿빟</h4>
                        <p className={styles.summaryHint}>
                          諛?湲곕낯 ?뺣낫, ?ъ쭊 ?붿빟, 由щ럭 ?붿빟??臾띠뼱??AI媛 ??
                          踰덉뿉 ?뺣━?⑸땲??
                        </p>
                      </div>

                      <button
                        type="button"
                        className={styles.summaryButton}
                        onClick={handleLoadRoomSummary}
                        disabled={!selectedRoomNo || summaryLoading}
                      >
                        {summaryLoading
                          ? '?붿빟 ?앹꽦 以?..'
                          : currentSummaryState?.summaryStatus === 'DONE' &&
                              currentRoomSummary
                            ? 'AI 諛??뺣낫 ?붿빟 ?ㅼ떆 遺덈윭?ㅺ린'
                            : 'AI 諛??뺣낫 ?붿빟'}
                      </button>
                    </div>

                    {summaryLoading && (
                      <div
                        className={styles.summaryLoading}
                        role="status"
                        aria-live="polite"
                      >
                        <span
                          className={styles.summarySpinner}
                          aria-hidden="true"
                        />
                        <span>AI媛 諛??뺣낫瑜??붿빟?섎뒗 以묒엯?덈떎...</span>
                      </div>
                    )}

                    {!summaryLoading && summaryError && (
                      <div className={styles.summaryError}>{summaryError}</div>
                    )}

                    {!summaryLoading &&
                      !summaryError &&
                      currentSummaryState?.summaryStatus === 'DONE' &&
                      currentRoomSummary && (
                        <div className={styles.summaryResult}>
                          {currentRoomSummary}
                        </div>
                      )}

                    {!summaryLoading &&
                      !summaryError &&
                      currentSummaryState?.summaryStatus !== 'DONE' && (
                        <div className={styles.summaryPlaceholder}>
                          踰꾪듉???꾨Ⅴ硫??꾩옱 諛⑹쓽 醫낇빀 ?붿빟 寃곌낵瑜??ш린?먯꽌
                          ?뺤씤?????덉뒿?덈떎.
                        </div>
                      )}
                  </div>
                </section>

                {/* 5) 諛⑹씠誘몄? */}
                <section className={styles.section}>
                  {/* <h3 className={styles.sectionTitle}>諛??ъ쭊</h3> */}
                  <ImageGallery images={roomImageUrls} />
                </section>

                {/* 6) 諛⑹젙蹂?(怨듭떎?щ? ?ы븿) */}
                <section className={styles.section}>
                  {/* <h3 className={styles.sectionTitle}>諛??뺣낫</h3> */}
                  <div className={styles.infoGrid}>
                    {/* <div>?썘截??몄떎: {room?.roomName ?? '-'}</div> */}
                    <div>
                      상태: {room?.roomEmptyYn ? '공실' : '거주중'}
                    </div>
                    <div>
                      ?랃툘 嫄곕옒:{' '}
                      {room?.roomMethod == 'L'
                        ? '?꾩꽭'
                        : room?.roomMethod == 'M'
                          ? '?붿꽭'
                          : '-'}
                    </div>
                    <div>?뮥 蹂댁쬆湲? {toKrwText(room?.roomDeposit)}</div>
                    <div>?뮥 ?붿꽭: {toKrwText(room?.roomMonthly)}</div>
                    <div>?뱪 硫댁쟻: {room?.roomArea ?? '-'}</div>
                    <div>?㎛ 諛⑺뼢: {room?.roomFacing ?? '-'}</div>
                    <div>?썜截?諛??? {room?.roomRoomCount ?? '-'}</div>
                    <div>?슺 ?뺤떎 ?? {room?.roomBathCount ?? '-'}</div>
                    <div>?뱠 ?낆＜媛?μ씪: {room?.roomAvailableDate ?? '-'}</div>
                  </div>

                  <div className={styles.abstractBox}>
                    {room?.roomAbstract || '?뚭컻 ?댁슜???놁뒿?덈떎.'}
                  </div>
                </section>

                {/* 7) 諛⑹샃??*/}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>諛??듭뀡</h3>
                  <RoomOptionList options={room?.roomOptions} />
                </section>

                {/* 8) 由щ럭(Page + ?レ옄 ?섏씠吏?ㅼ씠?? */}
                <section className={styles.section}>
                  <br />
                  <br />
                  {/* <h3 className={styles.sectionTitle}>由щ럭</h3> */}
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
