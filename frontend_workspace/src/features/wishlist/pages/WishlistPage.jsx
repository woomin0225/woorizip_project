import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getWishlistPageByUser, deleteWishlist } from '../api/wishlistAPI';
import { getRoom, getRoomImages } from '../../houseAndRoom/api/roomApi';
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

function pickImageName(x) {
  if (!x) return null;
  if (typeof x === 'string') return x;
  return x.imageName || x.storedImageName || x.fileName || x.roomImageName || x.name || null;
}

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const PAGE_SIZE = 8;
  const BULK_PAGE_SIZE = 100;

  async function load(nextPage = 1) {
    try {
      setError('');
      const userNo = getCurrentUserNo();
      if (!userNo) {
        throw new Error('로그인 사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
      }

      const pageRes = await getWishlistPageByUser(userNo, nextPage, PAGE_SIZE);
      const list = pageRes.content || [];

      const enriched = await Promise.all(
        list.map(async (item) => {
          try {
            const [room, images] = await Promise.all([
              getRoom(item.roomNo),
              getRoomImages(item.roomNo),
            ]);

            const firstImageName =
              Array.isArray(images) && images.length > 0 ? pickImageName(images[0]) : null;

            return {
              ...item,
              roomName: room?.roomName || item.roomNo,
              roomMethod: room?.roomMethod || null,
              roomDeposit: room?.roomDeposit ?? null,
              roomMonthly: room?.roomMonthly ?? null,
              roomArea: room?.roomArea ?? null,
              roomFacing: room?.roomFacing ?? null,
              roomRoomCount: room?.roomRoomCount ?? null,
              roomEmptyYn: room?.roomEmptyYn ?? null,
              roomImageCount: room?.roomImageCount ?? 0,
              imageName: firstImageName,
            };
          } catch {
            return item;
          }
        })
      );

      setItems(enriched);
      setPage(pageRes.page || nextPage);
      setTotalPages(pageRes.totalPages || 0);
    } catch (e) {
      setItems([]);
      setError(e.message || '찜목록 조회 실패');
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  const clickPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    load(p);
  };

  const handleDeleteAll = async () => {
    const userNo = getCurrentUserNo();
    if (!userNo) {
      setError('로그인 사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
      return;
    }

    if (!window.confirm('찜목록을 전체 삭제하시겠습니까?')) return;

    try {
      setError('');
      setIsDeletingAll(true);

      const first = await getWishlistPageByUser(userNo, 1, BULK_PAGE_SIZE);
      const all = [...(first.content || [])];

      for (let p = 2; p <= (first.totalPages || 0); p += 1) {
        const next = await getWishlistPageByUser(userNo, p, BULK_PAGE_SIZE);
        all.push(...(next.content || []));
      }

      const wishNos = Array.from(
        new Set(
          all
            .map((x) => x?.wishNo)
            .filter((v) => v !== null && v !== undefined)
        )
      );

      await Promise.allSettled(wishNos.map((wishNo) => deleteWishlist(wishNo)));
      await load(1);
    } catch (e) {
      setError(e.message || '찜목록 전체 삭제 실패');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <>
      <section className={`section section-shaped section-lg ${styles.heroSection}`}>
        <div className="shape shape-style-1 bg-gradient-info">
          <span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      </section>
      <section className={styles.contentSection}>
        <Container>
          <Row>
            <Col lg="3" className="mb-4">
              <Card className={`shadow border-0 ${styles.mainCard}`}>
                <CardBody><MyPageSideNav /></CardBody>
              </Card>
            </Col>
            <Col lg="9">
              <Card className={`shadow border-0 ${styles.mainCard}`}>
                <CardBody>
                  <div className={styles.headerRow}>
                    <div>
                      <h2 className={styles.title}>찜목록</h2>
                      <p className={styles.subTitle}>내가 저장한 매물 목록</p>
                    </div>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={handleDeleteAll}
                      disabled={isDeletingAll || items.length === 0}
                    >
                      {isDeletingAll ? '전체 삭제 중...' : '찜목록 전체삭제'}
                    </button>
                  </div>

                  {error && <p className={styles.desc}>{error}</p>}
                  {!error && items.length === 0 && <p className={styles.desc}>찜목록이 없습니다.</p>}
                  {!error && items.length > 0 && (
                    <>
                      <WishlistTable
                        items={items}
                        onDelete={async (wishNo) => {
                          await deleteWishlist(wishNo);
                          const fallback = items.length === 1 && page > 1 ? page - 1 : page;
                          await load(fallback);
                        }}
                      />

                      {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={styles.inlineBtn}
                            onClick={() => clickPage(page - 1)}
                            disabled={page <= 1}
                          >
                            이전
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              type="button"
                              className={`${styles.inlineBtn} ${p === page ? styles.inlineBtnActive : ''}`}
                              onClick={() => clickPage(p)}
                            >
                              {p}
                            </button>
                          ))}

                          <button
                            type="button"
                            className={styles.inlineBtn}
                            onClick={() => clickPage(page + 1)}
                            disabled={page >= totalPages}
                          >
                            다음
                          </button>
                        </div>
                      )}
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
