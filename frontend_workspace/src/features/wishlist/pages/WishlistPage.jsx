import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getWishlistByUser, deleteWishlist } from '../api/wishlistAPI';
import { parseJwt } from '../../../app/providers/utils/jwt';
import WishlistTable from '../components/WishlistTable';
import styles from '../../../app/layouts/MyPageLayout.module.css';

function getCurrentUserNo() {
  const fromStorage = localStorage.getItem('userNo') || localStorage.getItem('userId');
  if (fromStorage) return fromStorage;

  const raw = localStorage.getItem('accessToken');
  if (!raw) return null;
  let token = String(raw).trim();
  if (token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1).trim();
  if (token.startsWith('Bearer ')) token = token.slice('Bearer '.length).trim();
  if (!token || token === 'null' || token === 'undefined') return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return payload.userNo || payload.userId || null;
}

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const userNo = getCurrentUserNo();
      if (!userNo) {
        throw new Error('로그인 사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
      }

      const list = await getWishlistByUser(userNo, 1, 20);
      setItems(list);
    } catch (e) {
      setItems([]);
      setError(e.message || '찜목록 조회 실패');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <section className={`section section-shaped section-lg ${styles.heroSection}`}><div className="shape shape-style-1 bg-gradient-info"><span /><span /><span /><span /><span /><span /><span /><span /></div></section>
      <section className={styles.contentSection}><Container><Row>
        <Col lg="3" className="mb-4"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody><MyPageSideNav /></CardBody></Card></Col>
        <Col lg="9"><Card className={`shadow border-0 ${styles.mainCard}`}><CardBody>
          <div className={styles.headerRow}><h2 className={styles.title}>찜목록</h2><p className={styles.subTitle}>내가 저장한 매물 목록</p></div>
          {error && <p className={styles.desc}>{error}</p>}
          {!error && items.length === 0 && <p className={styles.desc}>찜목록이 없습니다.</p>}
          {!error && items.length > 0 && (
            <WishlistTable items={items} onDelete={async (wishNo) => { await deleteWishlist(wishNo); await load(); }} />
          )}
        </CardBody></Card></Col>
      </Row></Container></section>
    </>
  );
}
