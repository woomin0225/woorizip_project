import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getTour, updateTour } from '../api/tourAPI';
import { cancelContract, getContract, requestContractAmendment } from '../../contract/api/contractAPI';
import { getRoom } from '../../houseAndRoom/api/roomApi';
import InlineCalendar from '../../../shared/components/InlineCalendar';
import layoutStyles from '../../../app/layouts/MyPageLayout.module.css';
import styles from './ApplicationDetail.module.css';

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
    case 'AMENDMENT_REQUESTED':
      return '수정요청중';
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

function getTodayLocalIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeIsoDate(value) {
  if (!value) return '';
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
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

export default function ApplicationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kind, id } = useParams();
  const isTour = kind === 'tour';
  const isContract = kind === 'contract';
  const stateItem = location.state?.item;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [tourDate, setTourDate] = useState('');
  const [tourTime, setTourTime] = useState('');
  const [tourMessage, setTourMessage] = useState('');
  const [tourReason, setTourReason] = useState('');
  const [tourCancelReason, setTourCancelReason] = useState('');

  const [contractDate, setContractDate] = useState('');
  const [contractTerm, setContractTerm] = useState('12');
  const [contractReason, setContractReason] = useState('');
  const [contractCancelReason, setContractCancelReason] = useState('');
  const todayIso = useMemo(() => getTodayLocalIso(), []);
  const [roomAvailableDateIso, setRoomAvailableDateIso] = useState('');
  const minDate = todayIso;
  const contractMinDate = useMemo(() => {
    if (!roomAvailableDateIso) return todayIso;
    return roomAvailableDateIso > todayIso ? roomAvailableDateIso : todayIso;
  }, [roomAvailableDateIso, todayIso]);

  const canRender = isTour || isContract;
  const tourStatus = String(item?.status || '').toUpperCase();
  const contractStatus = String(item?.status || '').toUpperCase();
  const canEditTour = isTour && ['PENDING', 'APPROVED'].includes(tourStatus);
  const canCancelTour = isTour && ['PENDING', 'APPROVED'].includes(tourStatus);
  const canEditContract = isContract && ['APPLIED', 'APPROVED'].includes(contractStatus);
  const canCancelContract = isContract && ['APPLIED', 'APPROVED', 'AMENDMENT_REQUESTED'].includes(contractStatus);

  const loadDetail = useCallback(async () => {
    if (!canRender || !id) return;
    setLoading(true);
    setError('');
    try {
      if (stateItem && (stateItem.tourNo === id || stateItem.contractNo === id)) {
        setItem(stateItem);
      } else if (isTour) {
        setItem(await getTour(id));
      } else {
        setItem(await getContract(id));
      }
    } catch (e) {
      setError(e.message || '상세 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [canRender, id, isTour, stateItem]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!item) return;
    if (isTour) {
      const nextTourDate = fmtDate(item.visitDate);
      setTourDate(nextTourDate === '-' ? '' : nextTourDate);
      setTourTime(fmtTime(item.visitTime));
      setTourMessage(item.message || '');
      setTourReason('');
      setTourCancelReason(item.canceledReason || '');
    } else if (isContract) {
      const nextContractDate = fmtDate(item.moveInDate);
      setContractDate(nextContractDate === '-' ? '' : nextContractDate);
      setContractTerm(String(item.termMonths || 12));
      setContractReason('');
      setContractCancelReason('');
    }
  }, [item, isContract, isTour]);

  useEffect(() => {
    if (!isContract || !item?.roomNo) {
      setRoomAvailableDateIso('');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const room = await getRoom(item.roomNo);
        if (!mounted) return;
        setRoomAvailableDateIso(normalizeIsoDate(room?.roomAvailableDate));
      } catch {
        if (!mounted) return;
        setRoomAvailableDateIso('');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isContract, item?.roomNo]);

  useEffect(() => {
    if (!isContract || !contractDate || !contractMinDate) return;
    if (contractDate < contractMinDate) {
      setContractDate(contractMinDate);
    }
  }, [contractDate, contractMinDate, isContract]);

  const detailRows = useMemo(() => {
    if (!item) return [];
    if (isTour) {
      return [
        { label: '방', value: getRoomName(item) },
        { label: '방문일', value: fmtDate(item.visitDate) },
        { label: '방문시간', value: fmtTime(item.visitTime) },
        { label: '상태', value: statusLabel(item.status) },
        { label: '신청 내용', value: item.message || '-' },
        { label: '취소 사유', value: item.canceledReason || '-' },
      ];
    }
    return [
      { label: '신청 번호', value: item.contractNo },
      { label: '방', value: getRoomName(item) },
      { label: '입주 희망일', value: fmtDate(item.moveInDate) },
      { label: '계약 기간', value: item.termMonths ? `${item.termMonths}개월` : '-' },
      { label: '상태', value: statusLabel(item.status) },
      { label: '계약서 URL', value: item.contractUrl || '-' },
      { label: '거절/취소 사유', value: item.rejectionReason || '-' },
    ];
  }, [isTour, item]);

  const onTourUpdate = async () => {
    if (!canEditTour) {
      setError('현재 상태에서는 투어 수정이 불가능합니다.');
      return;
    }
    if (!item?.tourNo || !tourDate || !tourTime) {
      setError('방문일/시간을 확인해 주세요.');
      return;
    }
    const reasonPrefix = tourReason.trim() ? `[수정사유] ${tourReason.trim()}\n` : '';
    const nextMessage = `${reasonPrefix}${(item.message || '').trim()}`.trim();
    try {
      setError('');
      setNotice('');
      await updateTour(item.tourNo, {
        roomNo: item.roomNo,
        userNo: item.userNo,
        visitDate: tourDate,
        visitTime: `${tourTime}:00`,
        message: nextMessage || item.message || '투어 일정 변경 요청',
        status: item.status || 'PENDING',
      });
      setNotice('투어 수정이 완료되었습니다.');
      await loadDetail();
    } catch (e) {
      setError(e.message || '투어 수정 실패');
    }
  };

  const onTourCancel = async () => {
    if (!canCancelTour) {
      setError('현재 상태에서는 투어 취소가 불가능합니다.');
      return;
    }
    if (!item?.tourNo) return;
    try {
      setError('');
      setNotice('');
      await updateTour(item.tourNo, {
        roomNo: item.roomNo,
        userNo: item.userNo,
        visitDate: fmtDate(item.visitDate),
        visitTime: item.visitTime,
        message: item.message || '',
        status: 'REJECTED',
        canceledReason: (tourCancelReason || '').trim() || '사용자 취소',
        canceledAt: toSqlDateTimeString(new Date()),
      });
      setNotice('투어 취소가 완료되었습니다.');
      await loadDetail();
    } catch (e) {
      setError(e.message || '투어 취소 실패');
    }
  };

  const onContractUpdate = async () => {
    if (!canEditContract) {
      setError('현재 상태에서는 수정 요청이 불가능합니다.');
      return;
    }
    if (!item?.contractNo || !contractDate) {
      setError('입주 희망일을 확인해 주세요.');
      return;
    }
    if (contractDate < contractMinDate) {
      setError(`입주 희망일은 ${contractMinDate} 이후로만 선택할 수 있습니다.`);
      return;
    }
    try {
      setError('');
      setNotice('');
      await requestContractAmendment(item.contractNo, {
        userNo: item.userNo,
        roomNo: item.roomNo,
        moveInDate: contractDate,
        termMonths: Number(contractTerm || 12),
        contractUrl: item.contractUrl || '',
        rejectionReason: (contractReason || '').trim(),
      });
      setNotice('입주 신청 수정 요청이 완료되었습니다.');
      await loadDetail();
    } catch (e) {
      setError(e.message || '수정 요청 실패');
    }
  };

  const onContractCancel = async () => {
    if (!canCancelContract) {
      setError('현재 상태에서는 취소 요청이 불가능합니다.');
      return;
    }
    if (!item?.contractNo) return;
    try {
      setError('');
      setNotice('');
      await cancelContract(item.contractNo, (contractCancelReason || '').trim() || '사용자 취소 요청');
      setNotice('입주 신청 취소가 완료되었습니다.');
      await loadDetail();
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
                  <div className={styles.headerRow}>
                    <h3 className={layoutStyles.sectionTitle}>{isTour ? '투어 신청 상세' : '입주 신청 상세'}</h3>
                    <div className={styles.headerActions}>
                      {isTour && item?.roomNo && (
                        <button
                          type="button"
                          className={layoutStyles.inlineBtn}
                          onClick={() => navigate(`/rooms/${item.roomNo}`)}
                        >
                          방 정보 보기
                        </button>
                      )}
                      <button type="button" className={layoutStyles.inlineBtn} onClick={() => navigate('/tour/list')}>
                        목록으로
                      </button>
                    </div>
                  </div>

                  {!canRender && <p className={layoutStyles.desc}>잘못된 접근입니다.</p>}
                  {loading && <p className={layoutStyles.desc}>상세 정보를 불러오는 중입니다...</p>}
                  {error && <p className={styles.error}>{error}</p>}
                  {notice && <p className={styles.notice}>{notice}</p>}

                  {!loading && canRender && item && (
                    <>
                      <div className={styles.detailCard}>
                        {detailRows.map((row) => (
                          <div key={row.label} className={styles.detailRow}>
                            <span className={styles.label}>{row.label}</span>
                            <span className={styles.value}>{row.value}</span>
                          </div>
                        ))}
                      </div>

                      {isTour && (
                        <>
                          <div className={styles.actionGrid}>
                            <div className={styles.actionCard}>
                              <h4 className={styles.cardTitle}>수정</h4>
                              <label className={styles.formLabel}>방문일</label>
                              <InlineCalendar value={tourDate} minDate={minDate} onChange={setTourDate} />
                              <p className={styles.datePreview}>
                                선택 날짜: {tourDate || '날짜를 선택해 주세요.'}
                              </p>
                              <label className={styles.formLabel}>방문시간</label>
                              <input
                                className={styles.input}
                                type="time"
                                value={tourTime}
                                onChange={(e) => setTourTime(e.target.value)}
                              />
                              <label className={styles.formLabel}>수정 사유</label>
                              <textarea
                                className={styles.textarea}
                                value={tourReason}
                                onChange={(e) => setTourReason(e.target.value)}
                                placeholder="일정 변경 사유를 입력해 주세요."
                              />
                              <label className={styles.formLabel}>기존 문의 내용(참고)</label>
                              <textarea
                                className={styles.textarea}
                                value={tourMessage}
                                readOnly
                                placeholder="기존 문의 내용이 없습니다."
                              />
                              <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={onTourUpdate}
                                disabled={!canEditTour}
                              >
                                수정 저장
                              </button>
                            </div>

                            <div className={styles.actionCard}>
                              <h4 className={styles.cardTitle}>취소</h4>
                              <label className={styles.formLabel}>취소 사유</label>
                              <textarea
                                className={styles.textarea}
                                value={tourCancelReason}
                                onChange={(e) => setTourCancelReason(e.target.value)}
                                placeholder="취소 사유를 입력해 주세요."
                              />
                              <button
                                type="button"
                                className={styles.dangerBtn}
                                onClick={onTourCancel}
                                disabled={!canCancelTour}
                              >
                                취소 요청
                              </button>
                            </div>
                          </div>
                          {!canEditTour && !canCancelTour && (
                            <p className={styles.hint}>현재 상태에서는 수정/취소가 불가능합니다.</p>
                          )}
                        </>
                      )}

                      {isContract && (
                        <>
                          <div className={styles.actionGrid}>
                            <div className={styles.actionCard}>
                              <h4 className={styles.cardTitle}>수정 요청</h4>
                              <label className={styles.formLabel}>입주 희망일</label>
                              <InlineCalendar value={contractDate} minDate={contractMinDate} onChange={setContractDate} />
                              <p className={styles.datePreview}>
                                선택 날짜: {contractDate || '날짜를 선택해 주세요.'}
                              </p>
                              <p className={styles.datePreview}>입주 가능일(최소): {contractMinDate}</p>
                              <label className={styles.formLabel}>계약 기간(개월)</label>
                              <input
                                className={styles.input}
                                type="number"
                                min="1"
                                value={contractTerm}
                                onChange={(e) => setContractTerm(e.target.value)}
                              />
                              <label className={styles.formLabel}>수정 사유</label>
                              <textarea
                                className={styles.textarea}
                                value={contractReason}
                                onChange={(e) => setContractReason(e.target.value)}
                                placeholder="수정 요청 사유를 입력해 주세요."
                              />
                              <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={onContractUpdate}
                                disabled={!canEditContract}
                              >
                                수정 요청
                              </button>
                            </div>

                            <div className={styles.actionCard}>
                              <h4 className={styles.cardTitle}>취소</h4>
                              <label className={styles.formLabel}>취소 사유</label>
                              <textarea
                                className={styles.textarea}
                                value={contractCancelReason}
                                onChange={(e) => setContractCancelReason(e.target.value)}
                                placeholder="취소 사유를 입력해 주세요."
                              />
                              <button
                                type="button"
                                className={styles.dangerBtn}
                                onClick={onContractCancel}
                                disabled={!canCancelContract}
                              >
                                취소 요청
                              </button>
                            </div>
                          </div>
                          {!canEditContract && !canCancelContract && (
                            <p className={styles.hint}>현재 상태에서는 수정/취소가 불가능합니다.</p>
                          )}
                        </>
                      )}
                    </>
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
