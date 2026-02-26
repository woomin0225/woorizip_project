import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import styles from '../../../app/layouts/MyPageLayout.module.css';

const quickMenus = [
  {
    title: '내정보',
    description: '회원 정보 확인 및 수정',
    to: '/mypage/info',
    buttonText: '바로가기',
  },
  {
    title: '찜목록',
    description: '저장한 매물 빠르게 확인',
    to: '/wishlist',
    buttonText: '목록보기',
  },
  {
    title: '신청현황',
    description: '투어 신청 상태 확인',
    to: '/tour/list',
    buttonText: '확인하기',
  },
  {
    title: '계약 내역',
    description: '계약 진행/완료 내역 확인',
    to: '/contract/list',
    buttonText: '확인하기',
  },
];

export default function MyPageHome() {
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
                    <h2 className={styles.title}>마이페이지</h2>
                    <p className={styles.subTitle}>
                      자주 사용하는 메뉴를 한 번에 확인하세요.
                    </p>
                  </div>

                  <div className={styles.grid2}>
                    {quickMenus.map((menu) => (
                      <div key={menu.to} className={styles.itemCard}>
                        <div style={{ flex: 1 }}>
                          <h4 className={styles.itemTitle}>{menu.title}</h4>
                          <p className={styles.desc} style={{ marginTop: 8 }}>
                            {menu.description}
                          </p>
                          <Link
                            to={menu.to}
                            className={styles.primaryBtn}
                            style={{
                              display: 'inline-block',
                              marginTop: 10,
                              textDecoration: 'none',
                            }}
                          >
                            {menu.buttonText}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
