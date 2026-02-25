import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import styles from '../../../app/layouts/MyPageLayout.module.css';

export default function Withdrawn() {
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
              <div className={styles.headerRow}><h2 className={styles.title}>회원탈퇴</h2><p className={styles.subTitle}>탈퇴 시 데이터는 복구되지 않습니다.</p></div>
              <button type="button" className={styles.dangerBtn}>회원탈퇴 진행</button>
            </CardBody></Card></Col>
          </Row>
        </Container>
      </section>
    </>
  );
}

