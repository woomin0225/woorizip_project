import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getTourPage, updateTour } from '../api/tourAPI';
import { cancelContract, getMyContractsPage, requestContractAmendment } from '../../contract/api/contractAPI';
import layoutStyles from '../../../app/layouts/MyPageLayout.module.css';
import styles from './OccupyApply.module.css';

const PAGE_SIZE = 8;

function statusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return '요청중';
    case 'APPROVED':
      return '승인됨';
    case 'REJECTED':
      return '취소/거절';
    case 'APPLIED':
      return '신청됨';
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

function toSqlDateTimeString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function getRoomName(item) {
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

  return item?.roomName || item?.room_name || item?.roomNo || '-';
}

export default function OccupyApply() {
  const [tourItems, setTourItems] = useState([]);
  const [tourPage, setTourPage] = useState(1);
  const [tourTotalPages, setTourTotalPages] = useState(0);
  const [contractItems, setContractItems] = useState([]);
  const [contractPage, setContractPage] = useState(1);
  const [contractTotalPages, setContractTotalPages] = useState(0);
  const [error, setError] = useState('');

  const loadTours = useCallback(async (nextPage = 1) => {
    const res = await getTourPage(nextPage, PAGE_SIZE);
    setTourItems(res.content || []);
    setTourPage(res.page || nextPage);
    setTourTotalPages(res.totalPages || 0);
  }, []);

  const loadContracts = useCallback(async (nextPage = 1) => {
    const res = await getMyContractsPage(nextPage, PAGE_SIZE);
    setContractItems(res.content || []);
    setContractPage(res.page || nextPage);
    setContractTotalPages(res.totalPages || 0);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setError('');
        await Promise.all([loadTours(1), loadContracts(1)]);
      } catch (e) {
        setError(e.message || '신청현황 조회 실패');
      }
    })();
  }, [loadTours, loadContracts]);

  const tourPages = useMemo(() => Array.from({ length: tourTotalPages }, (_, i) => i + 1), [tourTotalPages]);
  const contractPages = useMemo(
    () => Array.from({ length: contractTotalPages }, (_, i) => i + 1),
    [contractTotalPages]
  );

  const onTourEdit = async (item) => {
    const nextDate = window.prompt('변경할 방문일(YYYY-MM-DD)', fmtDate(item.visitDate));
    if (!nextDate) return;
    const nextTime = window.prompt('변경할 방문시간(HH:mm)', fmtTime(item.visitTime) || '14:00');
    if (!nextTime) return;
    const nextMessage = window.prompt('문의사항', item.message || '');
    try {
      await updateTour(item.tourNo, {
        roomNo: item.roomNo,
        userNo: item.userNo,
        visitDate: nextDate,
        visitTime: `${nextTime}:00`,
        message: nextMessage || '투어 일정 변경 요청',
        status: item.status || 'PENDING',
      });
      await loadTours(tourPage);
    } catch (e) {
      setError(e.message || '투어 일정 수정 실패');
    }
  };

  const onTourCancel = async (item) => {
    const reason = window.prompt('취소 사유를 입력해 주세요.', item.canceledReason || '');
    if (reason === null) return;
    try {
      await updateTour(item.tourNo, {
        roomNo: item.roomNo,
        userNo: item.userNo,
        visitDate: item.visitDate,
        visitTime: item.visitTime,
        message: item.message || '',
        status: 'REJECTED',
        canceledReason: reason || '사용자 취소',
        canceledAt: toSqlDateTimeString(new Date()),
      });
      await loadTours(tourPage);
    } catch (e) {
      setError(e.message || '투어 취소 실패');
    }
  };

  const onContractAmend = async (item) => {
    const nextDate = window.prompt('변경할 입주 희망일(YYYY-MM-DD)', fmtDate(item.moveInDate));
    if (!nextDate) return;
    const nextTerm = window.prompt('변경할 계약 개월 수', String(item.termMonths || 12));
    if (!nextTerm) return;

    try {
      await requestContractAmendment(item.contractNo, {
        userNo: item.userNo,
        roomNo: item.roomNo,
        moveInDate: nextDate,
        termMonths: Number(nextTerm),
        contractUrl: item.contractUrl || '',
      });
      await loadContracts(contractPage);
    } catch (e) {
      setError(e.message || '수정 요청 실패');
    }
  };

  const onContractCancel = async (item) => {
    const reason = window.prompt('취소 사유를 입력해 주세요.', '');
    if (reason === null) return;
    try {
      await cancelContract(item.contractNo, reason || '사용자 취소 요청');
      await loadContracts(contractPage);
    } catch (e) {
      setError(e.message || '취소 요청 실패');
    }
  };

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

                  <div className={layoutStyles.sectionBlock}>
                    <h3 className={layoutStyles.sectionTitle}>투어 신청</h3>
                    {tourItems.length === 0 && <p className={layoutStyles.desc}>투어 신청 내역이 없습니다.</p>}
                    {tourItems.length > 0 && (
                      <>
                        <div className={styles.listHeader}>
                          <span>방</span>
                          <span>방문일</span>
                          <span>시간</span>
                          <span>상태</span>
                          <span>수정</span>
                          <span>취소</span>
                        </div>
                        {tourItems.map((item) => (
                          <div key={item.tourNo} className={styles.listRow}>
                            <span className={styles.oneLine}>{getRoomName(item)}</span>
                            <span>{fmtDate(item.visitDate)}</span>
                            <span>{fmtTime(item.visitTime)}</span>
                            <span>{statusLabel(item.status)}</span>
                            <span>
                              <button type="button" className={styles.smallBtn} onClick={() => onTourEdit(item)}>
                                수정
                              </button>
                            </span>
                            <span>
                              <button type="button" className={styles.smallBtn} onClick={() => onTourCancel(item)}>
                                취소
                              </button>
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
                    <h3 className={layoutStyles.sectionTitle}>입주 신청</h3>
                    {contractItems.length === 0 && <p className={layoutStyles.desc}>입주 신청 내역이 없습니다.</p>}
                    {contractItems.length > 0 && (
                      <>
                        <div className={styles.listHeader}>
                          <span>방</span>
                          <span>방문일</span>
                          <span>시간</span>
                          <span>상태</span>
                          <span>수정</span>
                          <span>취소</span>
                        </div>
                        {contractItems.map((item) => (
                          <div key={item.contractNo} className={styles.listRow}>
                            <span className={styles.oneLine}>{getRoomName(item)}</span>
                            <span>{fmtDate(item.moveInDate)}</span>
                            <span>{item.termMonths ? `${item.termMonths}개월` : '-'}</span>
                            <span>{statusLabel(item.status)}</span>
                            <span>
                              <button type="button" className={styles.smallBtn} onClick={() => onContractAmend(item)}>
                                수정
                              </button>
                            </span>
                            <span>
                              <button type="button" className={styles.smallBtn} onClick={() => onContractCancel(item)}>
                                취소
                              </button>
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
                    <p className={layoutStyles.desc}>신청현황이 없습니다.</p>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
