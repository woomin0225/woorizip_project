import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import styles from '../../../app/layouts/MyPageLayout.module.css';

const items = [1, 2, 3, 4];

export default function MyContract() {
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
              <div className={styles.headerRow}><h2 className={styles.title}>계약 내역</h2><p className={styles.subTitle}>계약 조회/수정 신청 상태입니다.</p></div>
              <div className={styles.grid2}>{items.map((n) => <div key={n} className={styles.itemCard}><div className={styles.thumb} /><div><h4 className={styles.itemTitle}>계약 #{n}</h4><p className={styles.meta}>월세 70만원 · 20㎡</p><p className={styles.desc}>상태: 진행중</p></div></div>)}</div>
            </CardBody></Card></Col>
          </Row>
        </Container>
      </section>
    </>
  );
}

