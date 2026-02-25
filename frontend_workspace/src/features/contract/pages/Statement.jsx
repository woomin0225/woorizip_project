import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, Badge } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getMyContracts } from '../api/contractAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';

export default function Statement() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyContracts().then(setItems).catch((e) => setError(e.message || '계약 내역 조회 실패'));
  }, []);

  return (
    <>
      <section className={`section section-shaped section-lg ${styles.heroSection}`}><div className="shape shape-style-1 bg-gradient-info"><span /><span /><span /><span /><span /><span /><span /><span /></div></section>
      <section className={styles.contentSection}><Container><Row>
        <Col lg="3" className="mb-4"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody><MyPageSideNav /></CardBody></Card></Col>
        <Col lg="9"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody>
          <div className={styles.headerRow}><h2 className={styles.title}>계약 내역</h2><p className={styles.subTitle}>계약 조회 / 수정 신청 / 승인 상태</p></div>
          {error && <p className={styles.desc}>{error}</p>}
          {!error && items.length === 0 && <p className={styles.desc}>계약 내역이 없습니다.</p>}
          {!error && items.length > 0 && <div className={styles.grid2}>{items.map((item) => <div key={item.contractNo} className={styles.itemCard}><div className={styles.thumb} /><div><h4 className={styles.itemTitle}>{item.title || item.roomNo || `계약 #${item.contractNo}`}</h4><p className={styles.meta}>월세 {Number(item.monthlyRent || 0).toLocaleString()}원 · {item.area || '-'}㎡</p><Badge color={item.status === '완료' ? 'success' : 'info'}>{item.status || '진행중'}</Badge></div></div>)}</div>}
        </CardBody></Card></Col>
      </Row></Container></section>
    </>
  );
}
