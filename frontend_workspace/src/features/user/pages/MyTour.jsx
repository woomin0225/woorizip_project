import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import styles from '../../../app/layouts/MyPageLayout.module.css';

const items = [1, 2, 3, 4];

export default function MyTour() {
  return (
    <>
      <section className={`section section-shaped section-lg ${styles.heroSection}`}>
        <div className="shape shape-style-1 bg-gradient-info"><span /><span /><span /><span /><span /><span /><span /><span /></div>
      </section>
      <section className={styles.contentSection}>
        <Container>
          <Row>
            <Col lg="3" className="mb-4"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody><MyPageSideNav /></CardBody></Card></Col>
            <Col lg="9"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody>
              <div className={styles.headerRow}><h2 className={styles.title}>신청현황</h2><p className={styles.subTitle}>투어 및 입주 신청 현황입니다.</p></div>
              <div className={styles.grid2}>{items.map((n) => <div key={n} className={styles.itemCard}><div className={styles.thumb} /><div><h4 className={styles.itemTitle}>신청 매물 #{n}</h4><p className={styles.meta}>투어 신청 · 2026-03-1{n} 14:00</p><p className={styles.desc}>상태: 검토중</p></div></div>)}</div>
            </CardBody></Card></Col>
          </Row>
        </Container>
      </section>
    </>
  );
}

