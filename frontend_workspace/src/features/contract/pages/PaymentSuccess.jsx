import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { requestContractPayment } from '../api/contractAPI';
import styles from './Completion.module.css';

const CONTEXT_KEY = 'contractPaymentContext';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);
  const onceRef = useRef(false);

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const paymentKey = params.get('paymentKey') || '';
  const orderId = params.get('orderId') || '';
  const amountParam = params.get('amount') || '';

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    const raw = sessionStorage.getItem(CONTEXT_KEY);
    if (!raw) {
      setError('결제 컨텍스트가 없어 완료 처리를 진행할 수 없습니다.');
      setProcessing(false);
      return;
    }

    let ctx = null;
    try {
      ctx = JSON.parse(raw);
    } catch {
      setError('결제 컨텍스트 파싱에 실패했습니다.');
      setProcessing(false);
      return;
    }

    const amount = Number(amountParam || 0);
    if (!paymentKey || !orderId || !amount || orderId !== ctx.orderId || amount !== Number(ctx.amount || 0)) {
      setError('결제 검증 값이 올바르지 않습니다.');
      setProcessing(false);
      return;
    }

    (async () => {
      try {
        const paymentRes = await requestContractPayment(ctx.contractNo, {
          paymentMethod: ctx.paymentMethod,
          amount,
          deposit: Number(ctx.deposit || 0),
          paymentKey,
          orderId,
        });
        sessionStorage.removeItem(CONTEXT_KEY);
        navigate('/contract/completion', {
          replace: true,
          state: {
            contractNo: ctx.contractNo,
            roomNo: ctx.roomNo,
            roomName: ctx.roomName,
            address: ctx.address,
            moveInDate: ctx.moveInDate,
            termMonths: Number(ctx.termMonths || 0),
            moveOutDate: ctx.moveOutDate,
            paymentMethod: ctx.paymentMethod,
            monthlyPayment: amount,
            deposit: Number(ctx.deposit || 0),
            accessGuide: ctx.accessGuide,
            integrationPending: [],
            contractDocumentUrl: ctx.contractDocumentUrl || '',
            paymentStatus: paymentRes?.status || 'PAID',
            paymentProvider: 'TOSS_TEST',
            signProvider: 'WOORIZIP_INTERNAL_SIGNATURE',
          },
        });
      } catch (e) {
        setError(e.message || '결제 완료 처리 중 오류가 발생했습니다.');
        setProcessing(false);
      }
    })();
  }, [amountParam, navigate, orderId, paymentKey]);

  return (
    <section className={styles.page}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="8">
            <Card className="shadow border-0">
              <CardBody>
                <h2 className={styles.title}>결제 완료 처리 중</h2>
                {processing && <p className={styles.desc}>토스 결제 승인 결과를 반영하고 있습니다...</p>}
                {!processing && error && <p className={styles.notice}>{error}</p>}
                {!processing && error && (
                  <div className={styles.buttonRow}>
                    <button type="button" className={styles.secondaryBtn} onClick={() => navigate('/')}>
                      홈으로
                    </button>
                    <button type="button" className={styles.primaryBtn} onClick={() => navigate('/mypage/contracts')}>
                      계약현황
                    </button>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
