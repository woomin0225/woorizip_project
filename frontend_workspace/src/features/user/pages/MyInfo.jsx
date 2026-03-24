import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import { getMyInfo } from '../api/userAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';

function pickFirst(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== '') || '';
}

function normalizeBirthDate(raw) {
  if (!raw) return '';
  const value = String(raw);
  return value.includes('T') ? value.split('T')[0] : value;
}

function calculateAge(birthDate) {
  if (!birthDate) return '-';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return '-';

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? String(age) : '-';
}

function genderLabel(gender) {
  if (!gender) return '-';
  const g = String(gender).toUpperCase();
  if (g === 'M' || g === 'MALE') return '남성';
  if (g === 'F' || g === 'FEMALE') return '여성';
  return String(gender);
}

function userTypeLabel(type) {
  if (!type) return '-';
  const t = String(type).toUpperCase();
  if (t === 'LESSOR' || t === 'LANDLORD') return '임대인';
  if (t === 'USER' || t === 'TENANT') return '사용자';
  return String(type);
}

export default function MyInfo() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyInfo()
      .then(setInfo)
      .catch((e) => setError(e.message || '내정보 조회 실패'));
  }, []);

  const birthDate = normalizeBirthDate(
    pickFirst(info?.birth_date, info?.birthDate)
  );

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
                    <h2 className={styles.title}>내정보 보기</h2>
                    <p className={styles.subTitle}>회원 정보를 확인합니다.</p>
                  </div>
                  {error && <p className={styles.desc}>{error}</p>}
                  {!error && !info && (
                    <p className={styles.desc}>불러오는 중...</p>
                  )}
                  {!!info && (
                    <>
                      <dl className={styles.infoGrid}>
                        <dt>이메일</dt>
                        <dd>
                          {pickFirst(info.emailId, info.email_id, info.email) ||
                            '-'}
                        </dd>
                        <dt>이름</dt>
                        <dd>{info.name || '-'}</dd>
                        <dt>휴대번호</dt>
                        <dd>
                          {pickFirst(
                            info.phone,
                            info.phoneNumber,
                            info.phone_number
                          ) || '-'}
                        </dd>
                        <dt>주소</dt>
                        <dd>
                          {pickFirst(
                            info.address,
                            info.addr,
                            info.roadAddress
                          ) || '-'}
                        </dd>
                        <dt>나이</dt>
                        <dd>{calculateAge(birthDate)}</dd>
                        <dt>성별</dt>
                        <dd>{genderLabel(info.gender)}</dd>
                        <dt>회원유형</dt>
                        <dd>{userTypeLabel(info.type)}</dd>
                      </dl>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        style={{ marginTop: 16 }}
                        onClick={() => navigate('/mypage/edit')}
                      >
                        수정하기
                      </button>
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
