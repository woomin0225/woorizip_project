import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { decideTour, getOwnerTourPage, getTourPage } from '../api/tourAPI';
import {
  decideContract,
  getMyContractsPage,
  getOwnerContractsPage,
} from '../../contract/api/contractAPI';
import { getHouse, getHouseMarkers } from '../../houseAndRoom/api/houseApi';
import { getRoom, getRoomImages } from '../../houseAndRoom/api/roomApi';
import {
  pickRepresentativeRoomImageName,
  toRoomImageUrl,
} from '../../houseAndRoom/utils/roomImage';
import { getMyInfo, isLessorType } from '../../user/api/userAPI';
import layoutStyles from '../../../app/layouts/MyPageLayout.module.css';
import styles from './OccupyApply.module.css';

const PAGE_SIZE = 8;
const PENDING_CONTRACT_STATUSES = new Set(['APPLIED', 'AMENDMENT_REQUESTED']);

function statusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return '승인대기';
    case 'APPROVED':
      return '승인됨';
    case 'REJECTED':
      return '취소/거절';
    case 'CANCELED':
    case 'CANCELLED':
      return '자동취소';
    case 'APPLIED':
      return '신청됨';
    case 'AMENDMENT_REQUESTED':
      return '수정요청중';
    case 'PAID':
      return '결제완료';
    case 'ACTIVE':
      return '진행중';
    default:
      return status || '-';
  }
}

function fmtDate(v) {
  if (!v) return '-';
  if (typeof v === 'string') return v.slice(0, 10);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(v) {
  if (!v) return '-';
  return String(v).slice(0, 5);
}

function getRoomName(item, fallbackLabel = '') {
  const fallback = String(fallbackLabel || '').trim();
  if (fallback) return fallback;

  const house = [
    item?.houseName,
    item?.house_name,
    item?.room?.houseName,
    item?.room?.house_name,
  ].find((v) => typeof v === 'string' && v.trim());

  const roomName = [
    item?.roomName,
    item?.room_name,
    item?.room?.roomName,
    item?.room?.room_name,
  ].find((v) => typeof v === 'string' && v.trim());

  if (house && roomName) {
    return `${house.trim()} ${roomName.trim()}`;
  }
  if (roomName) return roomName.trim();
  if (house) return house.trim();

  const abstractValue = [
    item?.roomAbstract,
    item?.room_abstract,
    item?.room?.roomAbstract,
    item?.room?.room_abstract,
  ].find((v) => typeof v === 'string' && v.trim());

  if (abstractValue) {
    const name = abstractValue.split(',')[0].trim();
    if (name) return name;
  }

  return item?.roomNo ? `방 #${item.roomNo}` : '-';
}

export default function OccupyApply() {
  const navigate = useNavigate();
  const [isLessor, setIsLessor] = useState(false);
  const [userTypeLoaded, setUserTypeLoaded] = useState(false);
  const [tourItems, setTourItems] = useState([]);
  const [tourPage, setTourPage] = useState(1);
  const [tourTotalPages, setTourTotalPages] = useState(0);
  const [contractItems, setContractItems] = useState([]);
  const [contractPage, setContractPage] = useState(1);
  const [contractTotalPages, setContractTotalPages] = useState(0);
  const [roomLabelByNo, setRoomLabelByNo] = useState({});
  const [roomImageByNo, setRoomImageByNo] = useState({});
  const [houseNameMap, setHouseNameMap] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [approvalSignerName, setApprovalSignerName] = useState('');
  const [approvalSignatureDataUrl, setApprovalSignatureDataUrl] = useState('');
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const approvalCanvasRef = useRef(null);
  const isApprovalDrawingRef = useRef(false);

  const loadTours = useCallback(async (nextPage = 1) => {
    const fetcher = isLessor ? getOwnerTourPage : getTourPage;
    const res = await fetcher(nextPage, PAGE_SIZE);
    setTourItems(res.content || []);
    setTourPage(res.page || nextPage);
    setTourTotalPages(res.totalPages || 0);
  }, [isLessor]);

  const loadContracts = useCallback(async (nextPage = 1) => {
    const fetcher = isLessor ? getOwnerContractsPage : getMyContractsPage;
    const res = await fetcher(nextPage, PAGE_SIZE);
    const content = Array.isArray(res.content)
      ? res.content.filter((item) =>
          PENDING_CONTRACT_STATUSES.has(String(item?.status || '').toUpperCase())
        )
      : [];
    setContractItems(content);
    setContractPage(res.page || nextPage);
    setContractTotalPages(res.totalPages || 0);
  }, [isLessor]);

  useEffect(() => {
    let mounted = true;
    getMyInfo()
      .then((info) => {
        if (!mounted) return;
        setIsLessor(isLessorType(info?.type));
        setApprovalSignerName(String(info?.name || '').trim());
      })
      .catch(() => {
        if (!mounted) return;
        setIsLessor(false);
      })
      .finally(() => {
        if (!mounted) return;
        setUserTypeLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const drawApprovalLine = useCallback((x0, y0, x1, y1) => {
    const canvas = approvalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#172b4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }, []);

  const getApprovalCanvasPoint = useCallback((evt) => {
    const canvas = approvalCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }, []);

  const syncApprovalSignatureDataUrl = useCallback(() => {
    const canvas = approvalCanvasRef.current;
    if (!canvas) return;
    setApprovalSignatureDataUrl(canvas.toDataURL('image/png'));
  }, []);

  const clearApprovalSignature = useCallback(() => {
    const canvas = approvalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setApprovalSignatureDataUrl('');
  }, []);

  const onApprovalPointerDown = useCallback((evt) => {
    const canvas = approvalCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(evt.pointerId);
    isApprovalDrawingRef.current = true;
    const point = getApprovalCanvasPoint(evt);
    canvas.dataset.prevX = String(point.x);
    canvas.dataset.prevY = String(point.y);
  }, [getApprovalCanvasPoint]);

  const onApprovalPointerMove = useCallback((evt) => {
    const canvas = approvalCanvasRef.current;
    if (!canvas || !isApprovalDrawingRef.current) return;
    const point = getApprovalCanvasPoint(evt);
    const prevX = Number(canvas.dataset.prevX || point.x);
    const prevY = Number(canvas.dataset.prevY || point.y);
    drawApprovalLine(prevX, prevY, point.x, point.y);
    canvas.dataset.prevX = String(point.x);
    canvas.dataset.prevY = String(point.y);
  }, [drawApprovalLine, getApprovalCanvasPoint]);

  const onApprovalPointerUp = useCallback((evt) => {
    const canvas = approvalCanvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(evt.pointerId)) {
      canvas.releasePointerCapture(evt.pointerId);
    }
    isApprovalDrawingRef.current = false;
    syncApprovalSignatureDataUrl();
  }, [syncApprovalSignatureDataUrl]);

  useEffect(() => {
    if (!approvalModalItem) return;
    const canvas = approvalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!approvalSignatureDataUrl) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = approvalSignatureDataUrl;
  }, [approvalModalItem, approvalSignatureDataUrl]);

  useEffect(() => {
    if (!userTypeLoaded) return;
    (async () => {
      setError('');
      setNotice('');

      const [tourResult, contractResult] = await Promise.allSettled([loadTours(1), loadContracts(1)]);
      const errors = [];

      if (tourResult.status === 'rejected') {
        setTourItems([]);
        setTourPage(1);
        setTourTotalPages(0);
        errors.push(`투어: ${tourResult.reason?.message || '조회 실패'}`);
      }

      if (contractResult.status === 'rejected') {
        setContractItems([]);
        setContractPage(1);
        setContractTotalPages(0);
        errors.push(`입주: ${contractResult.reason?.message || '조회 실패'}`);
      }

      if (errors.length > 0) {
        setError(`${isLessor ? '승인현황' : '신청현황'} 일부 조회 실패 (${errors.join(' / ')})`);
      }
    })();
  }, [isLessor, loadTours, loadContracts, userTypeLoaded]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const markers = await getHouseMarkers({});
        if (!mounted || !Array.isArray(markers)) return;
        const map = {};
        markers.forEach((m) => {
          const no = String(m?.houseNo || '').trim();
          const name = String(m?.houseName || '').trim();
          if (no && name) map[no] = name;
        });
        setHouseNameMap(map);
      } catch {
        // marker 조회 실패 시 room/house 개별조회 fallback 사용
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const roomNos = Array.from(
      new Set(
        [...tourItems, ...contractItems]
          .map((item) => item?.roomNo)
          .filter((v) => v !== null && v !== undefined && v !== '')
      )
    );
    const missing = roomNos.filter((roomNo) => !roomLabelByNo[roomNo]);
    if (missing.length === 0) return;

    let mounted = true;
    (async () => {
      const results = await Promise.all(
        missing.map(async (roomNo) => {
          try {
            const room = await getRoom(roomNo);
            const roomName = String(room?.roomName || room?.room_name || '').trim();
            let houseName = String(room?.houseName || room?.house_name || '').trim();

            if (!houseName && room?.houseNo) {
              const houseNo = String(room.houseNo);
              if (houseNameMap[houseNo]) {
                houseName = houseNameMap[houseNo];
              }
            }

            if (!houseName && room?.houseNo) {
              const houseNo = String(room.houseNo);
              try {
                const house = await getHouse(houseNo);
                houseName = String(house?.houseName || '').trim();
              } catch {
                houseName = '';
              }
            }

            let label = '';
            if (houseName && roomName) label = `${houseName} ${roomName}`;
            else if (houseName) label = `${houseName} 방 #${roomNo}`;
            else if (roomName) label = roomName;

            if (!label && room?.houseNo) {
              label = `건물 #${room.houseNo} 방 #${roomNo}`;
            }

            if (!label) {
              label = `방 #${roomNo}`;
            }
            return [roomNo, label];
          } catch {
            return [roomNo, `방 #${roomNo}`];
          }
        })
      );

      if (!mounted) return;
      setRoomLabelByNo((prev) => {
        const next = { ...prev };
        results.forEach(([roomNo, label]) => {
          if (label) next[roomNo] = label;
        });
        return next;
      });
    })();

    return () => {
      mounted = false;
    };
  }, [tourItems, contractItems, roomLabelByNo, houseNameMap]);

  useEffect(() => {
    const roomNos = Array.from(
      new Set(
        [...tourItems, ...contractItems]
          .map((item) => String(item?.roomNo || '').trim())
          .filter(Boolean)
      )
    );
    const missing = roomNos.filter((roomNo) => roomImageByNo[roomNo] === undefined);
    if (missing.length === 0) return;

    let mounted = true;
    (async () => {
      const results = await Promise.all(
        missing.map(async (roomNo) => {
          try {
            const images = await getRoomImages(roomNo);
            const imageName = Array.isArray(images) && images.length > 0
              ? pickRepresentativeRoomImageName(images[0])
              : null;
            return [roomNo, toRoomImageUrl(imageName)];
          } catch {
            return [roomNo, null];
          }
        })
      );

      if (!mounted) return;
      setRoomImageByNo((prev) => {
        const next = { ...prev };
        results.forEach(([roomNo, imageUrl]) => {
          next[roomNo] = imageUrl;
        });
        return next;
      });
    })();

    return () => {
      mounted = false;
    };
  }, [contractItems, roomImageByNo, tourItems]);

  const canReviewTour = useCallback((item) => {
    const status = String(item?.status || '').toUpperCase();
    return ['PENDING', 'APPLIED'].includes(status);
  }, []);

  const canReviewContract = useCallback((item) => {
    const status = String(item?.status || '').toUpperCase();
    return ['APPLIED', 'AMENDMENT_REQUESTED'].includes(status);
  }, []);

  const onTourDecision = useCallback(
    async (item, nextStatus) => {
      if (!item?.tourNo) return;
      try {
        setError('');
        setNotice('');
        let reason = '';
        if (nextStatus === 'REJECTED') {
          reason = window.prompt('거절 사유를 입력해 주세요.', '') || '';
        }
        await decideTour(item.tourNo, nextStatus, reason.trim());
        setNotice(nextStatus === 'APPROVED' ? '투어 신청을 승인했습니다.' : '투어 신청을 거절했습니다.');
        await loadTours(tourPage);
      } catch (e) {
        setError(e.message || '투어 승인 처리 실패');
      }
    },
    [loadTours, tourPage]
  );

  const onContractDecision = useCallback(
    async (item, nextStatus) => {
      if (!item?.contractNo) return;
      try {
        setError('');
        setNotice('');
        if (nextStatus === 'APPROVED') {
          setApprovalSignatureDataUrl('');
          setApprovalModalItem(item);
          return;
        }
        let reason = '';
        if (nextStatus === 'REJECTED') {
          reason = window.prompt('거절 사유를 입력해 주세요.', '') || '';
        }
        await decideContract(item.contractNo, nextStatus, reason.trim(), item.status);
        setNotice(nextStatus === 'APPROVED' ? '입주 신청을 승인했습니다.' : '입주 신청을 거절했습니다.');
        await loadContracts(contractPage);
      } catch (e) {
        setError(e.message || '입주 신청 승인 처리 실패');
      }
    },
    [contractPage, loadContracts]
  );

  const closeApprovalModal = useCallback(() => {
    setApprovalModalItem(null);
    setApprovalSignatureDataUrl('');
  }, []);

  const submitContractApproval = useCallback(async () => {
    if (!approvalModalItem?.contractNo) return;
    if (!approvalSignerName.trim()) {
      setError('임대인 서명자 이름을 입력해 주세요.');
      return;
    }
    if (!approvalSignatureDataUrl) {
      setError('임대인 서명을 입력해 주세요.');
      return;
    }

    try {
      setError('');
      setNotice('');
      await decideContract(
        approvalModalItem.contractNo,
        'APPROVED',
        '',
        approvalModalItem.status,
        {
          signerName: approvalSignerName.trim(),
          signatureDataUrl: approvalSignatureDataUrl,
          signedAt: new Date().toISOString(),
        }
      );
      closeApprovalModal();
      setNotice('입주 신청을 승인했습니다.');
      await loadContracts(contractPage);
    } catch (e) {
      setError(e.message || '입주 신청 승인 처리 실패');
    }
  }, [
    approvalModalItem,
    approvalSignerName,
    approvalSignatureDataUrl,
    closeApprovalModal,
    contractPage,
    loadContracts,
  ]);

  const tourPages = useMemo(() => Array.from({ length: tourTotalPages }, (_, i) => i + 1), [tourTotalPages]);
  const contractPages = useMemo(
    () => Array.from({ length: contractTotalPages }, (_, i) => i + 1),
    [contractTotalPages]
  );

  return (
    <>
      <section className={`section section-shaped section-lg ${layoutStyles.heroSection}`}>
        <div className="shape shape-style-1 bg-gradient-info">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className={layoutStyles.contentSection}>
        <Container>
          <Row>
            <Col lg="3" className="mb-4">
              <Card className={`shadow border-0 ${layoutStyles.mainCard}`}>
                <CardBody>
                  <MyPageSideNav />
                </CardBody>
              </Card>
            </Col>
            <Col lg="9">
                <Card className={`shadow border-0 ${layoutStyles.mainCard}`}>
                <CardBody>
                  {error && <p className={layoutStyles.desc}>{error}</p>}
                  {notice && <p className={layoutStyles.desc}>{notice}</p>}

                  <div className={layoutStyles.sectionBlock}>
                    <h3 className={layoutStyles.sectionTitle}>{isLessor ? '투어 승인' : '투어 신청'}</h3>
                    {tourItems.length === 0 && (
                      <p className={layoutStyles.desc}>
                        {isLessor ? '승인할 투어 신청 내역이 없습니다.' : '투어 신청 내역이 없습니다.'}
                      </p>
                    )}
                    {tourItems.length > 0 && (
                      <>
                        <div className={`${styles.listHeader} ${isLessor ? styles.listHeaderLessor : ''}`}>
                          <span>방</span>
                          <span>방문일</span>
                          <span>시간</span>
                          <span>상태</span>
                          <span>{isLessor ? '승인처리' : '상세'}</span>
                        </div>
                        {tourItems.map((item) => (
                          <div
                            key={item.tourNo}
                            className={`${styles.listRow} ${isLessor ? styles.listRowLessor : ''}`}
                          >
                            <span className={styles.roomCell}>
                              {roomImageByNo[item.roomNo] ? (
                                <img
                                  className={styles.roomThumb}
                                  src={roomImageByNo[item.roomNo]}
                                  alt="방 대표 이미지"
                                />
                              ) : (
                                <div className={styles.roomThumbPlaceholder}>No Image</div>
                              )}
                              <span className={styles.oneLine}>{getRoomName(item, roomLabelByNo[item.roomNo])}</span>
                            </span>
                            <span>{fmtDate(item.visitDate)}</span>
                            <span>{fmtTime(item.visitTime)}</span>
                            <span>{statusLabel(item.status)}</span>
                            <span>
                              {!isLessor && (
                                <button
                                  type="button"
                                  className={styles.smallBtn}
                                  onClick={() =>
                                    navigate(`/mypage/applications/tour/${item.tourNo}`, {
                                      state: { item, kind: 'tour' },
                                    })
                                  }
                                >
                                  상세
                                </button>
                              )}
                              {isLessor && (
                                <div className={styles.actionStack}>
                                  <button
                                    type="button"
                                    className={styles.smallBtn}
                                    onClick={() =>
                                      navigate(`/mypage/applications/tour/${item.tourNo}`, {
                                        state: { item, kind: 'tour' },
                                      })
                                    }
                                  >
                                    내역
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.smallBtn}
                                    onClick={() => onTourDecision(item, 'APPROVED')}
                                    disabled={!canReviewTour(item)}
                                  >
                                    승인
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.smallBtn} ${styles.rejectBtn}`}
                                    onClick={() => onTourDecision(item, 'REJECTED')}
                                    disabled={!canReviewTour(item)}
                                  >
                                    거절
                                  </button>
                                </div>
                              )}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {tourTotalPages > 1 && (
                      <div className={layoutStyles.pager}>
                        <button
                          type="button"
                          className={layoutStyles.inlineBtn}
                          onClick={() => loadTours(Math.max(1, tourPage - 1))}
                          disabled={tourPage <= 1}
                        >
                          이전
                        </button>
                        {tourPages.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`${layoutStyles.inlineBtn} ${p === tourPage ? layoutStyles.inlineBtnActive : ''}`}
                            onClick={() => loadTours(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={layoutStyles.inlineBtn}
                          onClick={() => loadTours(Math.min(tourTotalPages, tourPage + 1))}
                          disabled={tourPage >= tourTotalPages}
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={layoutStyles.sectionBlock}>
                    <h3 className={layoutStyles.sectionTitle}>{isLessor ? '입주 승인' : '입주 신청'}</h3>
                    {contractItems.length === 0 && (
                      <p className={layoutStyles.desc}>
                        {isLessor ? '승인할 입주 신청 내역이 없습니다.' : '입주 신청 내역이 없습니다.'}
                      </p>
                    )}
                    {contractItems.length > 0 && (
                      <>
                        <div className={`${styles.listHeader} ${isLessor ? styles.listHeaderLessor : ''}`}>
                          <span>방</span>
                          <span>입주일</span>
                          <span>기간</span>
                          <span>상태</span>
                          <span>{isLessor ? '승인처리' : '상세'}</span>
                        </div>
                        {contractItems.map((item) => (
                          <div
                            key={item.contractNo}
                            className={`${styles.listRow} ${isLessor ? styles.listRowLessor : ''}`}
                          >
                            <span className={styles.roomCell}>
                              {roomImageByNo[item.roomNo] ? (
                                <img
                                  className={styles.roomThumb}
                                  src={roomImageByNo[item.roomNo]}
                                  alt="방 대표 이미지"
                                />
                              ) : (
                                <div className={styles.roomThumbPlaceholder}>No Image</div>
                              )}
                              <span className={styles.oneLine}>{getRoomName(item, roomLabelByNo[item.roomNo])}</span>
                            </span>
                            <span>{fmtDate(item.moveInDate)}</span>
                            <span>{item.termMonths ? `${item.termMonths}개월` : '-'}</span>
                            <span>{statusLabel(item.status)}</span>
                            <span>
                              {!isLessor && (
                                <button
                                  type="button"
                                  className={styles.smallBtn}
                                  onClick={() =>
                                    navigate(`/mypage/applications/contract/${item.contractNo}`, {
                                      state: { item, kind: 'contract' },
                                    })
                                  }
                                >
                                  상세
                                </button>
                              )}
                              {isLessor && (
                                <div className={styles.actionStack}>
                                  <button
                                    type="button"
                                    className={styles.smallBtn}
                                    onClick={() =>
                                      navigate(`/mypage/applications/contract/${item.contractNo}`, {
                                        state: { item, kind: 'contract' },
                                      })
                                    }
                                  >
                                    내역
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.smallBtn}
                                    onClick={() => onContractDecision(item, 'APPROVED')}
                                    disabled={!canReviewContract(item)}
                                  >
                                    승인
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.smallBtn} ${styles.rejectBtn}`}
                                    onClick={() => onContractDecision(item, 'REJECTED')}
                                    disabled={!canReviewContract(item)}
                                  >
                                    거절
                                  </button>
                                </div>
                              )}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    {contractTotalPages > 1 && (
                      <div className={layoutStyles.pager}>
                        <button
                          type="button"
                          className={layoutStyles.inlineBtn}
                          onClick={() => loadContracts(Math.max(1, contractPage - 1))}
                          disabled={contractPage <= 1}
                        >
                          이전
                        </button>
                        {contractPages.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`${layoutStyles.inlineBtn} ${p === contractPage ? layoutStyles.inlineBtnActive : ''}`}
                            onClick={() => loadContracts(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={layoutStyles.inlineBtn}
                          onClick={() => loadContracts(Math.min(contractTotalPages, contractPage + 1))}
                          disabled={contractPage >= contractTotalPages}
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </div>

                  {!error && tourItems.length === 0 && contractItems.length === 0 && (
                    <p className={layoutStyles.desc}>{isLessor ? '승인현황이 없습니다.' : '신청현황이 없습니다.'}</p>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      {approvalModalItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h4 className={styles.modalTitle}>임대인 승인 서명</h4>
            <p className={styles.modalDesc}>
              {getRoomName(approvalModalItem, roomLabelByNo[approvalModalItem.roomNo])} 계약 승인 전 서명을 남겨주세요.
            </p>
            <label className={styles.modalLabel}>서명자 이름</label>
            <input
              className={styles.modalInput}
              type="text"
              value={approvalSignerName}
              onChange={(e) => setApprovalSignerName(e.target.value)}
              placeholder="임대인 이름"
            />
            <label className={styles.modalLabel}>임대인 서명</label>
            <div className={styles.signatureWrap}>
              <canvas
                ref={approvalCanvasRef}
                width={640}
                height={180}
                className={styles.signatureCanvas}
                onPointerDown={onApprovalPointerDown}
                onPointerMove={onApprovalPointerMove}
                onPointerUp={onApprovalPointerUp}
                onPointerCancel={onApprovalPointerUp}
                onPointerLeave={onApprovalPointerUp}
              />
              <div className={styles.signatureActions}>
                <button type="button" className={styles.smallBtn} onClick={clearApprovalSignature}>
                  서명 지우기
                </button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.smallBtn} ${styles.rejectBtn}`} onClick={closeApprovalModal}>
                취소
              </button>
              <button type="button" className={styles.smallBtn} onClick={submitContractApproval}>
                서명 후 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
