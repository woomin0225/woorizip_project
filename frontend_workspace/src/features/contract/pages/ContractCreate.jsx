import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import {
  applyContract,
  createElectronicContract,
  requestContractPayment,
  verifyElectronicSignature,
} from '../api/contractAPI';
import { getRoom, getRoomImages } from '../../houseAndRoom/api/roomApi';
import { getHouse } from '../../houseAndRoom/api/houseApi';
import { getMyInfo } from '../../user/api/userAPI';
import InlineCalendar from '../../../shared/components/InlineCalendar';
import styles from './ContractCreate.module.css';

const TERM_PRESETS = [1, 3, 6, 12];

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

function pickImageName(x) {
  if (!x) return null;
  if (typeof x === 'string') return x;
  return x.imageName || x.storedImageName || x.fileName || x.roomImageName || x.name || null;
}

function addMonthsIso(dateString, months) {
  if (!dateString || !months) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '-';
  d.setMonth(d.getMonth() + Number(months));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMoney(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString('ko-KR')}원`;
}

function methodLabel(method) {
  if (method === 'M') return '월세';
  if (method === 'L') return '전세';
  return method || '거래유형';
}

function occupancyLabel(roomCount) {
  const n = Number(roomCount);
  if (!n || Number.isNaN(n)) return '-';
  if (n <= 1) return '1인';
  return `${n}인`;
}

export default function ContractCreate() {
  const navigate = useNavigate();
  const { roomNo: routeRoomNo } = useParams();
  const [step, setStep] = useState(1);
  const [room, setRoom] = useState(null);
  const [house, setHouse] = useState(null);
  const [thumb, setThumb] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractNo, setContractNo] = useState(null);

  const [moveInDate, setMoveInDate] = useState('');
  const [termMonths, setTermMonths] = useState(12);
  const [amendReason, setAmendReason] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [agreePersonal, setAgreePersonal] = useState(false);
  const [agreeContract, setAgreeContract] = useState(false);
  const [agreeSign, setAgreeSign] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  const todayIso = useMemo(() => getTodayLocalIso(), []);
  const roomAvailableDateIso = useMemo(() => normalizeIsoDate(room?.roomAvailableDate), [room?.roomAvailableDate]);
  const minDate = useMemo(() => {
    if (!roomAvailableDateIso) return todayIso;
    return roomAvailableDateIso > todayIso ? roomAvailableDateIso : todayIso;
  }, [roomAvailableDateIso, todayIso]);
  const displayRoomName = room?.roomName || `방 #${routeRoomNo || '-'}`;
  const who = userInfo?.name || '계약 신청자';
  const monthlyFee = Number(room?.roomMonthly || 0);
  const deposit = Number(room?.roomDeposit || 0);
  const totalMonthlyPayment = monthlyFee;
  const rentPayDay = moveInDate ? `매월 ${Number(String(moveInDate).slice(-2))}일` : '-';
  const expectedMoveOutDate = addMonthsIso(moveInDate, termMonths);

  const whereLabel = useMemo(() => {
    if (house?.houseAddress) {
      return `${house.houseAddress}${house?.houseAddressDetail ? ` ${house.houseAddressDetail}` : ''}`;
    }
    return displayRoomName;
  }, [displayRoomName, house]);

  useEffect(() => {
    if (!routeRoomNo) return;
    (async () => {
      try {
        const roomDto = await getRoom(routeRoomNo);
        setRoom(roomDto || null);
        if (roomDto?.houseNo) {
          try {
            const houseDto = await getHouse(roomDto.houseNo);
            setHouse(houseDto || null);
          } catch {
            setHouse(null);
          }
        }
      } catch (e) {
        setError(e.message || '방 정보를 불러오지 못했습니다.');
      }
    })();
  }, [routeRoomNo]);

  useEffect(() => {
    if (!routeRoomNo) return;
    (async () => {
      try {
        const images = await getRoomImages(routeRoomNo);
        const firstImageName =
          Array.isArray(images) && images.length > 0 ? pickImageName(images[0]) : null;
        setThumb(firstImageName ? `/upload_files/room_image/${firstImageName}` : '');
      } catch {
        setThumb('');
      }
    })();
  }, [routeRoomNo]);

  useEffect(() => {
    (async () => {
      try {
        const info = await getMyInfo();
        setUserInfo(info || null);
        if (info?.name) setSignatureName(info.name);
      } catch {
        setUserInfo(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!moveInDate || !minDate) return;
    if (moveInDate < minDate) {
      setMoveInDate(minDate);
    }
  }, [minDate, moveInDate]);

  const ensureContractCreated = async () => {
    if (contractNo) return contractNo;
    if (!routeRoomNo) throw new Error('방 번호를 확인할 수 없습니다.');
    const res = await applyContract(routeRoomNo, {
      moveInDate,
      termMonths: Number(termMonths),
    });
    const nextNo = res?.contractNo || res?.id || null;
    if (nextNo) setContractNo(nextNo);
    return nextNo;
  };

  const onNextFromStep1 = () => {
    setError('');
    setNotice('');
    if (!moveInDate) {
      setError('입주 희망일을 선택해 주세요.');
      return;
    }
    if (moveInDate < minDate) {
      setError(`입주 희망일은 ${minDate} 이후로만 선택할 수 있습니다.`);
      return;
    }
    if (!termMonths || Number(termMonths) < 1) {
      setError('거주기간(개월)을 1 이상 입력해 주세요.');
      return;
    }
    setStep(2);
  };

  const onNextFromStep2 = () => {
    setError('');
    setNotice('');
    if (!agreePersonal || !agreeContract || !agreeSign) {
      setError('전자계약 동의 항목을 모두 체크해 주세요.');
      return;
    }
    if (!signatureName.trim()) {
      setError('전자서명(이름)을 입력해 주세요.');
      return;
    }
    setStep(3);
  };

  const onSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!paymentMethod) {
      setError('결제 수단을 선택해 주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      const pending = [];
      const ensuredContractNo = await ensureContractCreated();

      if (!ensuredContractNo) {
        pending.push('계약번호 미반환으로 전자계약/서명/결제 API는 샘플 모드로 처리');
      } else {
        try {
          await createElectronicContract(ensuredContractNo, {
            roomNo: routeRoomNo,
            moveInDate,
            termMonths: Number(termMonths),
            memo: amendReason.trim(),
          });
        } catch {
          pending.push('전자계약 API 연동 대기');
        }

        try {
          await verifyElectronicSignature(ensuredContractNo, {
            signerName: signatureName.trim(),
            agreedAt: new Date().toISOString(),
          });
        } catch {
          pending.push('전자서명 API 연동 대기');
        }

        try {
          await requestContractPayment(ensuredContractNo, {
            paymentMethod,
            amount: totalMonthlyPayment,
            deposit,
          });
        } catch {
          pending.push('결제 API 연동 대기');
        }
      }

      if (pending.length > 0) {
        setNotice(`일부 단계는 샘플 모드로 처리되었습니다: ${pending.join(', ')}`);
      }

      navigate('/contract/completion', {
        state: {
          contractNo: ensuredContractNo,
          roomNo: routeRoomNo,
          roomName: displayRoomName,
          address: whereLabel,
          moveInDate,
          termMonths: Number(termMonths),
          moveOutDate: expectedMoveOutDate,
          paymentMethod,
          monthlyPayment: totalMonthlyPayment,
          deposit,
          accessGuide: '관리사무소 또는 집주인과 입실 안내를 확인해 주세요.',
          integrationPending: pending,
        },
      });
    } catch (e2) {
      setError(e2.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className={styles.page}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="9">
            <Card className="shadow border-0">
              <CardBody>
                <h2 className={styles.title}>입주신청 / 전자계약 진행</h2>
                <div className={styles.stepFlow}>
                  {['입주신청', '계약', '완료'].map((label, idx) => {
                    const isActive = idx + 1 <= step;
                    return (
                      <React.Fragment key={label}>
                        <div className={`${styles.stepBadge} ${isActive ? styles.stepBadgeActive : ''}`}>
                          {label}
                        </div>
                        {idx < 2 && <span className={styles.stepArrow}>{'>'}</span>}
                      </React.Fragment>
                    );
                  })}
                </div>

                {error && <p className={styles.error}>{error}</p>}
                {notice && <p className={styles.notice}>{notice}</p>}

                {step === 1 && (
                  <>
                    <div className={styles.roomSummary}>
                      <div className={styles.imageWrap}>
                        {thumb ? (
                          <img className={styles.roomImage} src={thumb} alt="방 대표 이미지" />
                        ) : (
                          <div className={styles.noImage}>대표 이미지 없음</div>
                        )}
                      </div>
                      <div className={styles.roomInfo}>
                        <div className={styles.roomInfoTop}>
                          <h3>{displayRoomName}</h3>
                          <span className={styles.roomState}>{room?.roomEmptyYn ? '공실' : '거주중'}</span>
                        </div>
                        <p className={styles.roomDesc}>{room?.roomAbstract || '선택한 방의 기본 정보입니다.'}</p>
                        <div className={styles.roomPriceRow}>
                          <span className={styles.roomMethod}>{methodLabel(room?.roomMethod)}</span>
                          <span>보증금 {formatMoney(deposit)}</span>
                          {room?.roomMethod !== 'L' && <span>월세 {formatMoney(monthlyFee)}</span>}
                        </div>
                        <div className={styles.roomMetaRow}>
                          <span>{room?.roomArea ? `${room.roomArea}㎡` : '면적 -'}</span>
                          <span>{room?.roomFacing || '방향 -'}</span>
                          <span>{occupancyLabel(room?.roomRoomCount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.summaryCard}>
                      <h4>신청 정보 요약</h4>
                      <div className={styles.summaryRow}><span>입주 예정일</span><span>{moveInDate || '입주 희망일을 선택해 주세요.'}</span></div>
                      <div className={styles.summaryRow}><span>입주 가능일(최소)</span><span>{minDate}</span></div>
                      <div className={styles.summaryRow}><span>주소</span><span>{whereLabel}</span></div>
                      <div className={styles.summaryRow}><span>신청자 이름</span><span>{who}</span></div>
                      <div className={styles.summaryRow}><span>신청 내용</span><span>{displayRoomName} 입주 계약 신청</span></div>
                    </div>

                    <div className={styles.formCard}>
                      <label className={styles.label}>입주 희망일</label>
                      <InlineCalendar value={moveInDate} minDate={minDate} onChange={setMoveInDate} />
                      <p className={styles.datePreview}>선택 날짜: {moveInDate || '날짜를 선택해 주세요.'}</p>

                      <label className={styles.label}>거주기간(월)</label>
                      <input
                        className={styles.input}
                        type="number"
                        min="1"
                        value={termMonths}
                        onChange={(e) => setTermMonths(e.target.value)}
                      />
                      <div className={styles.presetRow}>
                        {TERM_PRESETS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`${styles.presetBtn} ${Number(termMonths) === m ? styles.presetBtnActive : ''}`}
                            onClick={() => setTermMonths(m)}
                          >
                            {m}개월
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.paymentPreview}>
                      <h4>예상 계약/납부 정보</h4>
                      <div className={styles.summaryRow}><span>보증금</span><span>{formatMoney(deposit)}</span></div>
                      <div className={styles.summaryRow}><span>월세</span><span>{formatMoney(monthlyFee)}</span></div>
                      <div className={styles.summaryRow}><span>예상 월 납부금액</span><span>{formatMoney(totalMonthlyPayment)}</span></div>
                      <div className={styles.summaryRow}><span>예상 월세 지불일</span><span>{rentPayDay}</span></div>
                      <div className={styles.summaryRow}><span>예상 퇴실일</span><span>{expectedMoveOutDate}</span></div>
                    </div>

                    <div className={styles.actionRow}>
                      <button type="button" className={styles.secondaryBtn} onClick={() => navigate(-1)}>이전</button>
                      <button type="button" className={styles.primaryBtn} onClick={onNextFromStep1}>다음</button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className={styles.formCard}>
                      <h4>전자계약서 작성 및 동의</h4>
                      <p className={styles.desc}>실제 API 연동 전까지는 샘플 흐름으로 동작합니다.</p>

                      <label className={styles.label}>전자계약 수정/요청 메모(선택)</label>
                      <textarea
                        className={styles.textarea}
                        value={amendReason}
                        onChange={(e) => setAmendReason(e.target.value)}
                        placeholder="특이사항이나 요청사항을 입력해 주세요."
                      />

                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={agreePersonal}
                          onChange={(e) => setAgreePersonal(e.target.checked)}
                        />
                        개인정보 수집 및 이용에 동의합니다.
                      </label>
                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={agreeContract}
                          onChange={(e) => setAgreeContract(e.target.checked)}
                        />
                        전자계약서 내용 확인 및 계약 진행에 동의합니다.
                      </label>
                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={agreeSign}
                          onChange={(e) => setAgreeSign(e.target.checked)}
                        />
                        전자서명으로 본인 인증을 진행하는 것에 동의합니다.
                      </label>

                      <label className={styles.label}>전자서명(이름 입력)</label>
                      <input
                        className={styles.input}
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="실명 입력"
                      />
                    </div>

                    <div className={styles.actionRow}>
                      <button type="button" className={styles.secondaryBtn} onClick={() => setStep(1)}>이전</button>
                      <button type="button" className={styles.primaryBtn} onClick={onNextFromStep2}>결제 단계로</button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <form onSubmit={onSubmitPayment}>
                    <div className={styles.formCard}>
                      <h4>결제 페이지</h4>
                      <div className={styles.summaryRow}><span>결제 대상 방</span><span>{displayRoomName}</span></div>
                      <div className={styles.summaryRow}><span>입주예정일</span><span>{moveInDate || '-'}</span></div>
                      <div className={styles.summaryRow}><span>거주기간</span><span>{termMonths}개월</span></div>
                      <div className={styles.summaryRow}><span>결제 예정 금액(월)</span><span>{formatMoney(totalMonthlyPayment)}</span></div>

                      <label className={styles.label}>결제수단</label>
                      <div className={styles.presetRow}>
                        {[
                          { code: 'CARD', name: '카드' },
                          { code: 'BANK', name: '계좌이체' },
                          { code: 'KAKAO', name: '간편결제' },
                        ].map((method) => (
                          <button
                            key={method.code}
                            type="button"
                            className={`${styles.presetBtn} ${paymentMethod === method.code ? styles.presetBtnActive : ''}`}
                            onClick={() => setPaymentMethod(method.code)}
                          >
                            {method.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.actionRow}>
                      <button type="button" className={styles.secondaryBtn} onClick={() => setStep(2)}>이전</button>
                      <button className={styles.primaryBtn} type="submit" disabled={isProcessing}>
                        {isProcessing ? '결제 처리 중...' : '결제 후 완료하기'}
                      </button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
