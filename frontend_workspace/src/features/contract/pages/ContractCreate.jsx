import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import {
  applyContract,
  createElectronicContract,
  verifyElectronicSignature,
} from '../api/contractAPI';
import { getRoom, getRoomImages } from '../../houseAndRoom/api/roomApi';
import {
  pickRepresentativeRoomImageName,
  toRoomImageUrl,
} from '../../houseAndRoom/utils/roomImage';
import { getHouse } from '../../houseAndRoom/api/houseApi';
import { getMyInfo, getUserByUserNo } from '../../user/api/userAPI';
import InlineCalendar from '../../../shared/components/InlineCalendar';
import styles from './ContractCreate.module.css';

const TERM_PRESETS = [1, 3, 6, 12];
const TOSS_SDK_URL = 'https://js.tosspayments.com/v1/payment';
const PAYMENT_CONTEXT_KEY = 'contractPaymentContext';
const CONSENT_DOCS = {
  personal: {
    title: '개인정보 수집·이용/제3자 제공 동의서',
    links: [{ label: '동의서 보기', url: '/legal/privacy-collection-consent.html' }],
    extraUrls: ['/legal/privacy-thirdparty-consent.html'],
  },
  contract: {
    title: '주택 임대차 전자계약서',
    links: [{ label: '계약서 보기', url: '/legal/lease-agreement-template.html' }],
  },
  sign: {
    title: '전자문서 및 전자서명 이용 동의서',
    links: [{ label: '전자서명 동의서 보기', url: '/legal/electronic-sign-consent.html' }],
  },
};

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDataUrlHtml(html) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

export default function ContractCreate() {
  const navigate = useNavigate();
  const { roomNo: routeRoomNo } = useParams();
  const [step, setStep] = useState(1);
  const [room, setRoom] = useState(null);
  const [house, setHouse] = useState(null);
  const [landlordInfo, setLandlordInfo] = useState(null);
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
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [docModal, setDocModal] = useState({ open: false, key: '', title: '', urls: [] });
  const [docConfirmed, setDocConfirmed] = useState({
    personal: false,
    contract: false,
    sign: false,
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const signatureCanvasRef = useRef(null);
  const isSignatureDrawingRef = useRef(false);

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
  const totalMonthlyPayment = monthlyFee > 0 ? monthlyFee : (deposit > 0 ? deposit : 1000);
  const rentPayDay = moveInDate ? `매월 ${Number(String(moveInDate).slice(-2))}일` : '-';
  const expectedMoveOutDate = addMonthsIso(moveInDate, termMonths);

  const whereLabel = useMemo(() => {
    if (house?.houseAddress) {
      return `${house.houseAddress}${house?.houseAddressDetail ? ` ${house.houseAddressDetail}` : ''}`;
    }
    return displayRoomName;
  }, [displayRoomName, house]);

  const landlordName = landlordInfo?.name || room?.userName || house?.userName || room?.lessorName || house?.lessorName || '-';
  const landlordPhone = landlordInfo?.phone || room?.userPhone || house?.userPhone || room?.lessorPhone || house?.lessorPhone || '-';
  const lessorUserNo = house?.userNo || house?.user_no || room?.userNo || room?.user_no || '';

  const drawSignatureLine = useCallback((x0, y0, x1, y1) => {
    const canvas = signatureCanvasRef.current;
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

  const getCanvasPoint = useCallback((evt) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }, []);

  const updateSignatureDataUrl = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  }, []);

  const onSignaturePointerDown = useCallback((evt) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(evt.pointerId);
    isSignatureDrawingRef.current = true;
    const point = getCanvasPoint(evt);
    canvas.dataset.prevX = String(point.x);
    canvas.dataset.prevY = String(point.y);
  }, [getCanvasPoint]);

  const onSignaturePointerMove = useCallback((evt) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !isSignatureDrawingRef.current) return;
    const point = getCanvasPoint(evt);
    const prevX = Number(canvas.dataset.prevX || point.x);
    const prevY = Number(canvas.dataset.prevY || point.y);
    drawSignatureLine(prevX, prevY, point.x, point.y);
    canvas.dataset.prevX = String(point.x);
    canvas.dataset.prevY = String(point.y);
  }, [drawSignatureLine, getCanvasPoint]);

  const onSignaturePointerUp = useCallback((evt) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(evt.pointerId)) {
      canvas.releasePointerCapture(evt.pointerId);
    }
    isSignatureDrawingRef.current = false;
    updateSignatureDataUrl();
  }, [updateSignatureDataUrl]);

  const buildLeasePreviewDataUrl = () => {
    const contractWrittenDate = getTodayLocalIso();
    const specialTerms = (amendReason || '').trim() || '특약 없음';
    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>주택 임대차 전자계약서</title>
  <style>
    body { font-family: 'Malgun Gothic', Arial, sans-serif; margin: 20px; color: #222; line-height: 1.5; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0 0 10px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; vertical-align: top; }
    th { width: 180px; background: #f7f7f7; }
    .sig { min-height: 52px; border: 1px dashed #bbb; padding: 8px; background: #fafafa; }
  </style>
</head>
<body>
  <h1>주택 임대차 전자계약서(간편 양식)</h1>
  <p>본 계약서는 우리집(Woorizip) 플랫폼에서 임대인과 임차인이 전자적으로 체결하는 주택 임대차 계약서입니다.</p>

  <h3>1. 당사자</h3>
  <table>
    <tr><th>임대인</th><td>${escapeHtml(landlordName)} / 연락처 ${escapeHtml(landlordPhone)}</td></tr>
    <tr><th>임차인</th><td>${escapeHtml(who)} / 연락처 ${escapeHtml(userInfo?.phone || userInfo?.phoneNumber || userInfo?.phone_number || '-')}</td></tr>
  </table>

  <h3>2. 목적물</h3>
  <table>
    <tr><th>주소</th><td>${escapeHtml(house?.houseAddress || '-')} ${escapeHtml(house?.houseAddressDetail || '')}</td></tr>
    <tr><th>호실</th><td>${escapeHtml(displayRoomName)}</td></tr>
  </table>

  <h3>3. 계약 조건</h3>
  <table>
    <tr><th>입주 예정일</th><td>${escapeHtml(moveInDate || '-')}</td></tr>
    <tr><th>계약기간</th><td>${escapeHtml(String(termMonths || '-'))}개월 (종료 예정일: ${escapeHtml(expectedMoveOutDate)})</td></tr>
    <tr><th>보증금</th><td>${escapeHtml(String(deposit || 0))}원</td></tr>
    <tr><th>월 차임</th><td>${escapeHtml(String(monthlyFee || 0))}원 (지급일: ${escapeHtml(rentPayDay)})</td></tr>
  </table>

  <h3>4. 특약</h3>
  <table>
    <tr><td>${escapeHtml(specialTerms)}</td></tr>
  </table>

  <h3>5. 서명</h3>
  <table>
    <tr><th>임대인 서명</th><td><div class="sig">승인 단계에서 작성</div></td></tr>
    <tr><th>임차인 서명</th><td><div class="sig">${
      signatureDataUrl
        ? `<img src="${signatureDataUrl}" alt="tenant-signature" style="max-width:280px; max-height:90px; object-fit:contain;" />`
        : '계약 단계에서 서명을 그려주세요.'
    }</div></td></tr>
    <tr><th>작성일</th><td>${escapeHtml(contractWrittenDate)}</td></tr>
  </table>
</body>
</html>`;
    return toDataUrlHtml(html);
  };

  const loadTossPaymentsSdk = () =>
    new Promise((resolve, reject) => {
      if (window.TossPayments) {
        resolve(window.TossPayments);
        return;
      }
      const existing = document.querySelector('script[data-toss-sdk="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.TossPayments), { once: true });
        existing.addEventListener('error', () => reject(new Error('토스 SDK 로드에 실패했습니다.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = TOSS_SDK_URL;
      script.async = true;
      script.dataset.tossSdk = 'true';
      script.onload = () => resolve(window.TossPayments);
      script.onerror = () => reject(new Error('토스 SDK 로드에 실패했습니다.'));
      document.head.appendChild(script);
    });

  const createOrderId = () => `woorizip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const requestTossPayment = async ({ orderId, amount, roomName, customerName, method }) => {
    const clientKey = (process.env.REACT_APP_TOSS_CLIENT_KEY || '').trim();
    if (!clientKey) {
      throw new Error('REACT_APP_TOSS_CLIENT_KEY가 설정되지 않았습니다.');
    }
    const TossPayments = await loadTossPaymentsSdk();
    const toss = TossPayments(clientKey);
    const successUrl = `${window.location.origin}/contract/payment/success`;
    const failUrl = `${window.location.origin}/contract/payment/fail`;
    const methodMap = {
      CARD: '카드',
      BANK: '가상계좌',
      KAKAO: '간편결제',
    };
    await toss.requestPayment(methodMap[method] || '카드', {
      amount: Number(amount),
      orderId,
      orderName: `${roomName} 임대차 계약`,
      customerName: customerName || '계약 신청자',
      successUrl,
      failUrl,
    });
  };

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
    if (!lessorUserNo) {
      setLandlordInfo(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const lessor = await getUserByUserNo(lessorUserNo);
        if (!mounted) return;
        setLandlordInfo(lessor || null);
      } catch {
        if (!mounted) return;
        setLandlordInfo(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lessorUserNo]);

  useEffect(() => {
    if (!routeRoomNo) return;
    (async () => {
      try {
        const images = await getRoomImages(routeRoomNo);
        const firstImageName =
          Array.isArray(images) && images.length > 0
            ? pickRepresentativeRoomImageName(images[0])
            : pickRepresentativeRoomImageName(room);
        setThumb(toRoomImageUrl(firstImageName) || '');
      } catch {
        setThumb('');
      }
    })();
  }, [room, routeRoomNo]);

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
    if (step !== 2) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!signatureDataUrl) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = signatureDataUrl;
  }, [step, signatureDataUrl]);

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
    if (!docConfirmed.personal || !docConfirmed.contract || !docConfirmed.sign) {
      setError('각 동의서 링크를 열어 내용을 확인한 뒤 확인 버튼을 눌러주세요.');
      return;
    }
    if (!signatureDataUrl) {
      setError('서명을 직접 그려주세요.');
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
      const ensuredContractNo = await ensureContractCreated();
      if (!ensuredContractNo) {
        throw new Error('계약번호 생성에 실패했습니다.');
      }
      const eContractRes = await createElectronicContract(ensuredContractNo, {
        roomNo: routeRoomNo,
        moveInDate,
        termMonths: Number(termMonths),
        memo: amendReason.trim(),
      });
      const signRes = await verifyElectronicSignature(ensuredContractNo, {
        signerName: (userInfo?.name || signatureName || '').trim(),
        agreedAt: new Date().toISOString(),
      });
      const contractUrl = signRes?.contractUrl || eContractRes?.contractUrl || '';
      const orderId = createOrderId();
      const context = {
        contractNo: ensuredContractNo,
        roomNo: routeRoomNo,
        roomName: displayRoomName,
        address: whereLabel,
        moveInDate,
        termMonths: Number(termMonths),
        moveOutDate: expectedMoveOutDate,
        paymentMethod,
        amount: totalMonthlyPayment,
        monthlyPayment: totalMonthlyPayment,
        deposit,
        accessGuide: '관리사무소 또는 집주인과 입실 안내를 확인해 주세요.',
        eformContractUrl: contractUrl,
        paymentProvider: 'TOSS_TEST',
        signProvider: 'EFORMSIGN_TEST',
        orderId,
        customerName: who,
      };
      sessionStorage.setItem(PAYMENT_CONTEXT_KEY, JSON.stringify(context));
      await requestTossPayment({
        orderId,
        amount: totalMonthlyPayment,
        roomName: displayRoomName,
        customerName: who,
        method: paymentMethod,
      });
    } catch (e2) {
      setError(e2.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDocModal = (key, title, urls) => {
    setDocModal({ open: true, key, title, urls });
  };

  const confirmDocModal = () => {
    if (docModal.key) {
      setDocConfirmed((prev) => ({ ...prev, [docModal.key]: true }));
    }
    setDocModal({ open: false, key: '', title: '', urls: [] });
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
                      <p className={styles.desc}>전자계약/서명 절차를 진행합니다.</p>

                      <label className={styles.label}>특약 제안 메모(선택)</label>
                      <textarea
                        className={`${styles.textarea} ${styles.textareaCompact}`}
                        value={amendReason}
                        onChange={(e) => setAmendReason(e.target.value)}
                        placeholder="임대인에게 제안할 특약/요청사항을 간단히 입력해 주세요."
                        maxLength={200}
                      />
                      <p className={styles.memoHint}>입력한 메모는 계약서 특약 항목에 반영됩니다.</p>

                      <label className={styles.label}>서명(직접 그리기)</label>
                      <div className={styles.signatureWrap}>
                        <canvas
                          ref={signatureCanvasRef}
                          width={640}
                          height={180}
                          className={styles.signatureCanvas}
                          onPointerDown={onSignaturePointerDown}
                          onPointerMove={onSignaturePointerMove}
                          onPointerUp={onSignaturePointerUp}
                          onPointerCancel={onSignaturePointerUp}
                          onPointerLeave={onSignaturePointerUp}
                        />
                        <div className={styles.signatureActions}>
                          <button type="button" className={styles.secondaryBtn} onClick={clearSignature}>
                            서명 지우기
                          </button>
                        </div>
                      </div>

                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={docConfirmed.personal}
                          readOnly
                          disabled
                        />
                        <span className={styles.checkText}>
                          개인정보 수집 및 이용/제3자 제공에 동의합니다.
                          {CONSENT_DOCS.personal.links.map((link) => (
                            <button
                              key={link.url}
                              type="button"
                              className={styles.linkBtn}
                              onClick={() =>
                                openDocModal(
                                  'personal',
                                  CONSENT_DOCS.personal.title,
                                  [link.url, ...(CONSENT_DOCS.personal.extraUrls || [])]
                                )
                              }
                            >
                              {link.label}
                            </button>
                          ))}
                        </span>
                      </label>
                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={docConfirmed.contract}
                          readOnly
                          disabled
                        />
                        <span className={styles.checkText}>
                          전자계약서 내용 확인 및 계약 진행에 동의합니다.
                          {CONSENT_DOCS.contract.links.map((link) => (
                            <button
                              key={link.url}
                              type="button"
                              className={styles.linkBtn}
                              onClick={() =>
                                openDocModal('contract', CONSENT_DOCS.contract.title, [buildLeasePreviewDataUrl()])
                              }
                            >
                              {link.label}
                            </button>
                          ))}
                        </span>
                      </label>
                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={docConfirmed.sign}
                          readOnly
                          disabled
                        />
                        <span className={styles.checkText}>
                          전자문서 및 전자서명 이용에 동의합니다.
                          {CONSENT_DOCS.sign.links.map((link) => (
                            <button
                              key={link.url}
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => openDocModal('sign', CONSENT_DOCS.sign.title, [link.url])}
                            >
                              {link.label}
                            </button>
                          ))}
                        </span>
                      </label>
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
      {docModal.open && (
        <div className={styles.docModalOverlay}>
          <div className={styles.docModalContent}>
            <div className={styles.docModalHeader}>
              <h4>{docModal.title}</h4>
            </div>
            <div className={styles.docFrameWrap}>
              {docModal.urls.map((url, idx) => (
                <iframe key={`${url}-${idx}`} title={`${docModal.title}-${idx + 1}`} src={url} className={styles.docFrame} />
              ))}
            </div>
            <div className={styles.docModalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setDocModal({ open: false, key: '', title: '', urls: [] })}>
                닫기
              </button>
              <button type="button" className={styles.primaryBtn} onClick={confirmDocModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
