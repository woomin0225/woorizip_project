import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../../user/components/MyPageSideNav';
import { getApiBaseUrl } from '../../../app/config/env';
import {
  getAdminContractsPage,
  getMyContractsPage,
  getOwnerContractsPage,
} from '../api/contractAPI';
import { getRoom } from '../../houseAndRoom/api/roomApi';
import { getHouse } from '../../houseAndRoom/api/houseApi';
import {
  getMyInfo,
  getUserByUserNo,
  isLessorType,
} from '../../user/api/userAPI';
import { useAuth } from '../../../app/providers/AuthProvider';
import styles from '../../../app/layouts/MyPageLayout.module.css';

const PAGE_SIZE = 8;
const ADMIN_PAGE_SIZE = 20;
const ADMIN_FETCH_SIZE = 100;
const API_BASE_URL = getApiBaseUrl();
const PENDING_CONTRACT_STATUSES = new Set(['APPLIED', 'AMENDMENT_REQUESTED']);

function moneyLabel(amount) {
  if (!amount && amount !== 0) return '-';
  return `${Math.round(Number(amount) / 10000).toLocaleString()}만 원`;
}

function fmtDate(v) {
  if (!v) return '-';
  if (typeof v === 'string') return v.slice(0, 10);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
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
    case 'AMENDMENT_REQUESTED':
      return '수정요청중';
    case 'ENDED':
      return '종료';
    case 'REJECTED':
      return '거절/취소';
    default:
      return status || '-';
  }
}

function addMonthsIso(dateValue, months) {
  if (!dateValue || !months) return '-';
  const base =
    typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue);
  if (Number.isNaN(base.getTime())) return '-';
  base.setMonth(base.getMonth() + Number(months));
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(base.getDate()).padStart(2, '0')}`;
}

function resolveContractUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (!s) return '';
  if (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('data:')
  ) {
    return s;
  }
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  return `${API_BASE_URL}/${s}`;
}

function matchesKeyword(item, meta, keyword) {
  if (!keyword) return true;
  const lowered = keyword.toLowerCase();
  return [
    item?.contractNo,
    item?.roomNo,
    item?.userNo,
    item?.status,
    contractStatusLabel(item?.status),
    meta?.roomName,
    meta?.tenantName,
    meta?.address,
  ].some((value) => String(value || '').toLowerCase().includes(lowered));
}

export default function Statement() {
  const { isAdmin } = useAuth();
  const [isLessor, setIsLessor] = useState(false);
  const [items, setItems] = useState([]);
  const [allAdminItems, setAllAdminItems] = useState([]);
  const [roomMeta, setRoomMeta] = useState({});
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  const loadMeta = useCallback(async (content, { includeTenant = false } = {}) => {
    const metaList = await Promise.all(
      content.map(async (contract) => {
        if (!contract?.roomNo) return [contract.contractNo, {}];
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
              moveOutDate: addMonthsIso(contract.moveInDate, contract.termMonths),
            },
          ];
        } catch {
          return [contract.contractNo, {}];
        }
      })
    );

    const nextMeta = Object.fromEntries(metaList);

    if (includeTenant) {
      const tenantEntries = await Promise.all(
        content.map(async (contract) => {
          if (!contract?.userNo) return [contract.contractNo, ''];
          try {
            const user = await getUserByUserNo(contract.userNo);
            return [contract.contractNo, String(user?.name || '').trim()];
          } catch {
            return [contract.contractNo, ''];
          }
        })
      );

      tenantEntries.forEach(([contractNo, tenantName]) => {
        nextMeta[contractNo] = {
          ...(nextMeta[contractNo] || {}),
          tenantName,
        };
      });
    }

    setRoomMeta(nextMeta);
    return nextMeta;
  }, []);

  const loadNormalPage = useCallback(
    async (nextPage = 1) => {
      const fetcher = isLessor ? getOwnerContractsPage : getMyContractsPage;
      const res = await fetcher(nextPage, PAGE_SIZE);
      const content = Array.isArray(res.content)
        ? res.content.filter(
            (item) =>
              !PENDING_CONTRACT_STATUSES.has(
                String(item?.status || '').toUpperCase()
              )
          )
        : [];

      setItems(content);
      setPage(res.page || nextPage);
      setTotalPages(res.totalPages || 0);
      const nextMeta = await loadMeta(content, { includeTenant: isLessor });
      setSelected((prev) => {
        if (!prev) return content[0] || null;
        return (
          content.find((item) => item.contractNo === prev.contractNo) ||
          content[0] ||
          null
        );
      });
      return nextMeta;
    },
    [isLessor, loadMeta]
  );

  const loadAdminContracts = useCallback(async () => {
    let nextPage = 1;
    let collected = [];
    while (true) {
      const res = await getAdminContractsPage(nextPage, ADMIN_FETCH_SIZE);
      const content = Array.isArray(res.content) ? res.content : [];
      collected = [...collected, ...content];
      if (content.length < ADMIN_FETCH_SIZE) break;
      nextPage += 1;
    }

    setAllAdminItems(collected);
    setPage(1);
    await loadMeta(collected, { includeTenant: true });
  }, [loadMeta]);

  useEffect(() => {
    let mounted = true;
    getMyInfo()
      .then((info) => {
        if (!mounted) return;
        setIsLessor(isLessorType(info?.type));
      })
      .catch(() => {
        if (!mounted) return;
        setIsLessor(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        if (isAdmin) {
          await loadAdminContracts();
          return;
        }
        await loadNormalPage(1);
      } catch (e) {
        setError(e.message || '계약 내역 조회 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, loadAdminContracts, loadNormalPage]);

  const filteredAdminItems = useMemo(() => {
    if (!isAdmin) return [];
    const keyword = search.trim().toLowerCase();
    return allAdminItems.filter((item) =>
      matchesKeyword(item, roomMeta[item.contractNo] || {}, keyword)
    );
  }, [allAdminItems, isAdmin, roomMeta, search]);

  const adminTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredAdminItems.length / ADMIN_PAGE_SIZE)),
    [filteredAdminItems.length]
  );

  const visibleItems = useMemo(() => {
    if (!isAdmin) return items;
    const startIndex = (page - 1) * ADMIN_PAGE_SIZE;
    return filteredAdminItems.slice(startIndex, startIndex + ADMIN_PAGE_SIZE);
  }, [filteredAdminItems, isAdmin, items, page]);

  useEffect(() => {
    if (!isAdmin) return;
    setPage(1);
  }, [isAdmin, search]);

  useEffect(() => {
    if (!isAdmin) return;
    setTotalPages(adminTotalPages);
    if (page > adminTotalPages) {
      setPage(adminTotalPages);
    }
  }, [adminTotalPages, isAdmin, page]);

  useEffect(() => {
    if (visibleItems.length === 0) {
      setSelected(null);
      return;
    }
    setSelected((prev) => {
      if (!prev) return visibleItems[0] || null;
      return (
        visibleItems.find((item) => item.contractNo === prev.contractNo) ||
        visibleItems[0] ||
        null
      );
    });
  }, [visibleItems]);

  const pageList = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <>
      <section className={`section section-shaped section-lg ${styles.heroSection}`}>
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
                    <div>
                      <h2 className={styles.title}>계약 현황</h2>
                      <p className={styles.subTitle}>
                        {isAdmin
                          ? '전체 계약 내역을 검색하고 페이지 단위로 확인할 수 있습니다.'
                          : isLessor
                            ? '승인 완료된 임대인 계약 목록입니다.'
                            : '승인 이후의 내 계약 목록입니다.'}
                      </p>
                    </div>
                    {isAdmin && (
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="계약번호, 방 이름, 사용자명, 주소 검색"
                        style={{
                          minWidth: 260,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid #d5dbea',
                        }}
                      />
                    )}
                  </div>

                  {error && <p className={styles.desc}>{error}</p>}
                  {loading && <p className={styles.desc}>계약 내역을 불러오는 중입니다.</p>}
                  {!loading && !error && visibleItems.length === 0 && (
                    <p className={styles.desc}>
                      {isAdmin ? '조회된 계약 내역이 없습니다.' : '표시할 계약 현황이 없습니다.'}
                    </p>
                  )}

                  {!loading && !error && visibleItems.length > 0 && (
                    <>
                      <div className={styles.listHeader}>
                        <span>상태</span>
                        <span>방</span>
                        <span>
                          {isAdmin
                            ? '계약자'
                            : isLessor
                              ? '계약자'
                              : '보증금 / 월세'}
                        </span>
                        <span>
                          {isAdmin
                            ? '보증금 / 월세'
                            : isLessor
                              ? '계약 종료일'
                              : '면적'}
                        </span>
                        <span>주소</span>
                        <span>{isAdmin ? '입주일' : isLessor ? '입주일' : '계약일'}</span>
                      </div>

                      {visibleItems.map((item) => {
                        const meta = roomMeta[item.contractNo] || {};
                        return (
                          <div
                            key={item.contractNo}
                            className={`${styles.listRow} ${styles.rowClickable} ${
                              selected?.contractNo === item.contractNo
                                ? styles.listRowActive
                                : ''
                            }`}
                            onClick={() => setSelected(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                setSelected(item);
                              }
                            }}
                          >
                            <span>{contractStatusLabel(item.status)}</span>
                            <span>{meta.roomName || item.roomNo || '-'}</span>
                            <span>
                              {isAdmin || isLessor
                                ? meta.tenantName || item.userNo || '-'
                                : `보증금 ${moneyLabel(meta.deposit)} / 월세 ${moneyLabel(
                                    meta.monthly
                                  )}`}
                            </span>
                            <span>
                              {isAdmin
                                ? `보증금 ${moneyLabel(meta.deposit)} / 월세 ${moneyLabel(
                                    meta.monthly
                                  )}`
                                : isLessor
                                  ? meta.moveOutDate || '-'
                                  : meta.area
                                    ? `${meta.area}㎡`
                                    : '-'}
                            </span>
                            <span className={styles.oneLine}>{meta.address || '-'}</span>
                            <span>{fmtDate(item.moveInDate || item.paymentDate)}</span>
                          </div>
                        );
                      })}

                      {totalPages > 1 && (
                        <div className={styles.pager}>
                          <button
                            type="button"
                            className={styles.inlineBtn}
                            onClick={() =>
                              isAdmin
                                ? setPage((prev) => Math.max(1, prev - 1))
                                : loadNormalPage(Math.max(1, page - 1))
                            }
                            disabled={page <= 1}
                          >
                            이전
                          </button>
                          {pageList.map((pageNumber) => (
                            <button
                              key={pageNumber}
                              type="button"
                              className={`${styles.inlineBtn} ${
                                pageNumber === page ? styles.inlineBtnActive : ''
                              }`}
                              onClick={() =>
                                isAdmin ? setPage(pageNumber) : loadNormalPage(pageNumber)
                              }
                            >
                              {pageNumber}
                            </button>
                          ))}
                          <button
                            type="button"
                            className={styles.inlineBtn}
                            onClick={() =>
                              isAdmin
                                ? setPage((prev) => Math.min(totalPages, prev + 1))
                                : loadNormalPage(Math.min(totalPages, page + 1))
                            }
                            disabled={page >= totalPages}
                          >
                            다음
                          </button>
                        </div>
                      )}

                      <div className={styles.contractPreview}>
                        <h3 className={styles.sectionTitle}>계약서 미리보기</h3>
                        {selected?.contractUrl ? (
                          <iframe
                            title="contract-preview"
                            src={resolveContractUrl(selected.contractUrl)}
                            className={styles.contractFrame}
                          />
                        ) : (
                          <p className={styles.desc}>
                            선택한 계약의 계약서 URL이 없습니다.
                          </p>
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
