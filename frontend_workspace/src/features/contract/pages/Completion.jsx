import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import styles from './Completion.module.css';

export default function Completion() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const moveInDate = state?.moveInDate || '-';
  const roomLabel = state?.roomName || (state?.roomNo ? `방 #${state.roomNo}` : '-');
  const address = state?.address || '-';
  const accessGuide = state?.accessGuide || '관리사무소 또는 집주인에게 입실 절차를 확인해 주세요.';
  const contractNo = state?.contractNo || '-';

  return (
    <section className={styles.page}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="8">
            <Card className="shadow border-0">
              <CardBody>
                <h2 className={styles.title}>결제가 완료되었습니다.</h2>
                <p className={styles.desc}>전자계약/결제 절차가 완료되어 입주 준비를 진행할 수 있습니다.</p>

                <div className={styles.summaryCard}>
                  <div className={styles.row}><span>입주예정일</span><span>{moveInDate}</span></div>
                  <div className={styles.row}><span>호실</span><span>{roomLabel}</span></div>
                  <div className={styles.row}><span>주소</span><span>{address}</span></div>
                  <div className={styles.row}><span>입실방법</span><span>{accessGuide}</span></div>
                  <div className={styles.row}><span>계약번호</span><span>{contractNo}</span></div>
                </div>

                {Array.isArray(state?.integrationPending) && state.integrationPending.length > 0 && (
                  <p className={styles.notice}>연동 대기: {state.integrationPending.join(', ')}</p>
                )}

                <div className={styles.buttonRow}>
                  <a
                    className={styles.linkBtn}
                    href="https://www.rtms.or.kr"
                    target="_blank"
                    rel="noreferrer"
                  >
                    주택임대차 신고 안내
                  </a>
                  <button type="button" className={styles.secondaryBtn} onClick={() => navigate('/')}>
                    홈으로
                  </button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => navigate('/mypage/contracts')}
                  >
                    마이페이지 계약현황
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
