import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getMyContractsPage } from '../api/contractAPI';
import { getRoom } from '../../houseAndRoom/api/roomApi';
import { getHouse } from '../../houseAndRoom/api/houseApi';
import styles from '../../../app/layouts/MyPageLayout.module.css';

const PAGE_SIZE = 8;

function moneyLabel(amount) {
  if (!amount && amount !== 0) return '-';
  return `${Math.round(Number(amount) / 10000).toLocaleString()}만`;
}

function fmtDate(v) {
  if (!v) return '-';
  if (typeof v === 'string') return v.slice(0, 10);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function contractStatusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'APPLIED':
      return '신청중';
    case 'APPROVED':
      return '승인됨';
    case 'PAID':
      return '결제완료';
    case 'ACTIVE':
      return '진행중';
    case 'ENDED':
      return '종료';
    case 'REJECTED':
      return '거절/취소';
    default:
      return status || '-';
  }
}

export default function Statement() {
  const [items, setItems] = useState([]);
  const [roomMeta, setRoomMeta] = useState({});
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadPage = useCallback(async (nextPage = 1) => {
    const res = await getMyContractsPage(nextPage, PAGE_SIZE);
    const content = res.content || [];
    setItems(content);
    setPage(res.page || nextPage);
    setTotalPages(res.totalPages || 0);
    setSelected((prev) => {
      if (!prev) return content[0] || null;
      return content.find((i) => i.contractNo === prev.contractNo) || content[0] || null;
    });

    const metaList = await Promise.all(
      content.map(async (contract) => {
        if (!contract.roomNo) return [contract.contractNo, {}];
        try {
          const room = await getRoom(contract.roomNo);
          let house = null;
          if (room?.houseNo) {
            try {
              house = await getHouse(room.houseNo);
            } catch {
              house = null;
            }
          }
          return [
            contract.contractNo,
            {
              roomName: room?.roomName || contract.roomNo,
              deposit: room?.roomDeposit,
              monthly: room?.roomMonthly,
              area: room?.roomArea,
              address: house?.houseAddress || '',
            },
          ];
        } catch {
          return [contract.contractNo, {}];
        }
      })
    );
    setRoomMeta(Object.fromEntries(metaList));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setError('');
        await loadPage(1);
      } catch (e) {
        setError(e.message || '계약 내역 조회 실패');
      }
    })();
  }, [loadPage]);

  const pageList = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

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
                    <h2 className={styles.title}>계약 내역</h2>
                    <p className={styles.subTitle}>계약 요약 목록 (클릭 시 계약서 보기)</p>
                  </div>
                  {error && <p className={styles.desc}>{error}</p>}
                  {!error && items.length === 0 && <p className={styles.desc}>계약 내역이 없습니다.</p>}
                  {!error && items.length > 0 && (
                    <>
                      <div className={styles.listHeader}>
                        <span>상태</span>
                        <span>방</span>
                        <span>보증금/월세</span>
                        <span>면적</span>
                        <span>주소</span>
                        <span>계약일</span>
                      </div>
                      {items.map((item) => {
                        const meta = roomMeta[item.contractNo] || {};
                        return (
                          <div
                            key={item.contractNo}
                            className={`${styles.listRow} ${styles.rowClickable} ${selected?.contractNo === item.contractNo ? styles.listRowActive : ''}`}
                            onClick={() => setSelected(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') setSelected(item);
                            }}
                          >
                            <span>{contractStatusLabel(item.status)}</span>
                            <span>{meta.roomName || item.roomNo || '-'}</span>
                            <span>{`보증금 ${moneyLabel(meta.deposit)} / 월세 ${moneyLabel(meta.monthly)}`}</span>
                            <span>{meta.area ? `${meta.area}㎡` : '-'}</span>
                            <span className={styles.oneLine}>{meta.address || '-'}</span>
                            <span>{fmtDate(item.paymentDate || item.moveInDate)}</span>
                          </div>
                        );
                      })}

                      {totalPages > 1 && (
                        <div className={styles.pager}>
                          <button type="button" className={styles.inlineBtn} onClick={() => loadPage(Math.max(1, page - 1))} disabled={page <= 1}>이전</button>
                          {pageList.map((p) => (
                            <button key={p} type="button" className={`${styles.inlineBtn} ${p === page ? styles.inlineBtnActive : ''}`} onClick={() => loadPage(p)}>{p}</button>
                          ))}
                          <button type="button" className={styles.inlineBtn} onClick={() => loadPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>다음</button>
                        </div>
                      )}

                      <div className={styles.contractPreview}>
                        <h3 className={styles.sectionTitle}>계약서 미리보기</h3>
                        {selected?.contractUrl ? (
                          <iframe title="contract-preview" src={selected.contractUrl} className={styles.contractFrame} />
                        ) : (
                          <p className={styles.desc}>선택한 계약의 계약서 URL이 없습니다.</p>
                        )}
                      </div>
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
