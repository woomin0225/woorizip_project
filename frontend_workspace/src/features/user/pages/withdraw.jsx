import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import { withdrawMyAccount } from '../api/userAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';
import { useAuth } from '../../../app/providers/AuthProvider';

export default function Withdraw() {
  const { clearTokens } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    '원하는 매물이 부족해서',
    '서비스 사용이 불편해서',
    '이용 빈도가 낮아서',
    '개인정보/보안이 걱정되어서',
    '기타',
  ];

  const canSubmit = reason && agreed && !isSubmitting;

  const handleWithdraw = async () => {
    if (!canSubmit) return;

    const confirmed = window.confirm(
      '회원탈퇴 후 계정은 복구할 수 없습니다. 정말 탈퇴하시겠습니까?'
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setError('');

      await withdrawMyAccount();

      alert('회원탈퇴가 완료되었습니다.');
      clearTokens();
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userNo');
      sessionStorage.removeItem('userType');
      localStorage.removeItem('userName');
      localStorage.removeItem('userNo');
      localStorage.removeItem('userType');
      localStorage.removeItem('email');
      localStorage.removeItem('emailId');
      navigate('/');
      window.location.reload();
    } catch (e) {
      setError(e.message || '회원탈퇴 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section
        className={`section section-shaped section-lg ${styles.heroSection}`}
      >
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
      <section className={styles.contentSection}>
        <Container>
          <Row>
            <Col lg="3" className="mb-4">
              <Card className={`shadow border-0 ${styles.mainCard}`}>
                <CardBody>
                  <MyPageSideNav />
                </CardBody>
              </Card>
            </Col>
            <Col lg="9">
              <Card className={`shadow border-0 ${styles.mainCard}`}>
                <CardBody>
                  <div className={styles.headerRow}>
                    <h2 className={styles.title}>회원탈퇴</h2>
                    <p className={styles.subTitle}>
                      탈퇴 사유를 알려주시면 서비스 개선에 반영하겠습니다.
                    </p>
                  </div>

                  <div className={styles.warningBox}>
                    <h4 className={styles.warningTitle}>탈퇴 전 꼭 확인해주세요</h4>
                    <ul className={styles.warningList}>
                      <li>탈퇴 후 계정은 복구할 수 없습니다.</li>
                      <li>찜목록, 신청/계약 관련 정보는 복원되지 않습니다.</li>
                      <li>같은 이메일로 재가입해도 기존 이용 이력은 연동되지 않을 수 있습니다.</li>
                    </ul>
                  </div>

                  <div className={styles.surveyBox}>
                    <h4 className={styles.surveyTitle}>회원탈퇴 사유</h4>
                    <div className={styles.reasonGroup}>
                      {reasons.map((item) => (
                        <label key={item} className={styles.reasonItem}>
                          <input
                            type="radio"
                            name="withdrawReason"
                            value={item}
                            checked={reason === item}
                            onChange={(event) => setReason(event.target.value)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>

                    <textarea
                      className={styles.reasonTextarea}
                      placeholder="추가 의견이 있으면 입력해주세요. (선택)"
                      rows={4}
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                    />

                    <label className={styles.confirmCheck}>
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(event) => setAgreed(event.target.checked)}
                      />
                      <span>
                        안내사항을 확인했으며, 탈퇴 시 복구가 불가능함에 동의합니다.
                      </span>
                    </label>
                  </div>

                  {error && <p className={styles.errorText}>{error}</p>}

                  <button
                    type="button"
                    className={styles.dangerBtn}
                    disabled={!canSubmit}
                    onClick={handleWithdraw}
                  >
                    {isSubmitting ? '처리 중...' : '회원탈퇴 진행'}
                  </button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
