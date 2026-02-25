import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, Badge } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getTourList } from '../api/tourAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';

export default function OccupyApply() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getTourList().then(setItems).catch((e) => setError(e.message || '신청현황 조회 실패'));
  }, []);

  return (
    <>
      <section className={`section section-shaped section-lg ${styles.heroSection}`}><div className="shape shape-style-1 bg-gradient-info"><span /><span /><span /><span /><span /><span /><span /><span /></div></section>
      <section className={styles.contentSection}><Container><Row>
        <Col lg="3" className="mb-4"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody><MyPageSideNav /></CardBody></Card></Col>
        <Col lg="9"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody>
          <div className={styles.headerRow}><h2 className={styles.title}>신청현황</h2><p className={styles.subTitle}>투어 및 입주 신청 현황 목록</p></div>
          {error && <p className={styles.desc}>{error}</p>}
          {!error && items.length === 0 && <p className={styles.desc}>신청현황이 없습니다.</p>}
          {!error && items.length > 0 && <div className={styles.grid2}>{items.map((item) => <div key={item.tourNo} className={styles.itemCard}><div className={styles.thumb} /><div><h4 className={styles.itemTitle}>{item.title || item.roomNo || `투어 #${item.tourNo}`}</h4><p className={styles.meta}>{item.tourDate || item.dateTime || '-'}</p><Badge color={item.status === '확정' ? 'success' : 'info'}>{item.status || '검토중'}</Badge></div></div>)}</div>}
        </CardBody></Card></Col>
      </Row></Container></section>
    </>
  );
}
