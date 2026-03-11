import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import styles from './Completion.module.css';

const CONTEXT_KEY = 'contractPaymentContext';

export default function PaymentFail() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const code = params.get('code') || '-';
  const message = params.get('message') || '결제가 취소되었거나 실패했습니다.';

  let roomNo = '';
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    const ctx = raw ? JSON.parse(raw) : null;
    roomNo = ctx?.roomNo || '';
  } catch {
    roomNo = '';
  }

  return (
    <section className={styles.page}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="8">
            <Card className="shadow border-0">
              <CardBody>
                <h2 className={styles.title}>결제에 실패했습니다.</h2>
                <p className={styles.desc}>결제 정보를 확인한 뒤 다시 시도해 주세요.</p>
                <div className={styles.summaryCard}>
                  <div className={styles.row}><span>오류 코드</span><span>{code}</span></div>
                  <div className={styles.row}><span>메시지</span><span>{message}</span></div>
                </div>
                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => navigate(roomNo ? `/rooms/${roomNo}/contract` : '/contract/apply')}
                  >
                    다시 시도
                  </button>
                  <button type="button" className={styles.primaryBtn} onClick={() => navigate('/mypage/contracts')}>
                    계약현황
                  </button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

