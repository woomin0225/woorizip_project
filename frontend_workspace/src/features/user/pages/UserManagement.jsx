import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import { getAdminUserListPage } from '../api/userAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';
import { useNavigate } from 'react-router-dom';

const FETCH_SIZE = 100;
const PAGE_SIZE = 20;

function pickFirst(...values) {
  return (
    values.find(
      (value) => value !== undefined && value !== null && value !== ''
    ) || ''
  );
}

function normalizeBirthDate(raw) {
  if (!raw) return '';
  const value = String(raw);
  return value.includes('T') ? value.split('T')[0] : value;
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? age : null;
}

function genderLabel(gender) {
  const value = String(gender || '').toUpperCase();
  if (value === 'M' || value === 'MALE') return '남성';
  if (value === 'F' || value === 'FEMALE') return '여성';
  return '-';
}

function userTypeLabel(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'LESSOR' || value === 'LANDLORD') return '임대인';
  if (value === 'ADMIN') return '관리자';
  if (value === 'USER' || value === 'TENANT') return '사용자';
  return value || '-';
}

function resolveUserType(user) {
  const role = String(user?.role || '').toUpperCase();
  const type = String(user?.type || '').toUpperCase();

  if (role === 'ADMIN') return 'ADMIN';
  if (type === 'LESSOR' || type === 'LANDLORD') return 'LESSOR';
  if (type === 'USER' || type === 'TENANT') return 'USER';
  return type || role || '';
}

function compareValues(a, b, direction = 'asc') {
  if (a === b) return 0;
  if (a === null || a === undefined || a === '')
    return direction === 'asc' ? 1 : -1;
  if (b === null || b === undefined || b === '')
    return direction === 'asc' ? -1 : 1;

  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  const left = String(a).localeCompare(String(b), 'ko', {
    numeric: true,
    sensitivity: 'base',
  });
  return direction === 'asc' ? left : -left;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({ key: 'typeLabel', direction: 'asc' });

  const handleTypeClick = (user) => {
    const type = String(user.type || '').toUpperCase();
    const state = { targetUserNo: user.userNo, targetUserType: type };

    if (type === 'ADMIN') return;

    if (type === 'USER' || type === 'TENANT') {
      navigate('/reservation/view', { state });
      return;
    }

    if (type === 'LESSOR' || type === 'LANDLORD') {
      navigate('/facility/view', { state });
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAllUsers() {
      try {
        setLoading(true);
        setError('');

        let page = 1;
        const collected = [];

        while (true) {
          const list = await getAdminUserListPage(page, FETCH_SIZE);
          const currentPageItems = Array.isArray(list) ? list : [];
          collected.push(...currentPageItems);
          if (currentPageItems.length < FETCH_SIZE) break;
          page += 1;
        }

        if (cancelled) return;

        const normalized = collected.map((user) => {
          const birthDate = normalizeBirthDate(
            pickFirst(user?.birthDate, user?.birth_date)
          );
          const resolvedType = resolveUserType(user);
          return {
            userNo: user?.userNo ?? null,
            emailId: pickFirst(user?.emailId, user?.email_id, user?.email),
            name: user?.name || '-',
            gender: user?.gender || '',
            genderLabel: genderLabel(user?.gender),
            age: calculateAge(birthDate),
            phone: pickFirst(
              user?.phone,
              user?.phoneNumber,
              user?.phone_number
            ),
            type: resolvedType,
            role: user?.role || '',
            typeLabel: userTypeLabel(resolvedType),
          };
        });

        setUsers(normalized);
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setError(e.message || '유저 목록 조회 실패');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAllUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedUsers = useMemo(() => {
    const copy = [...users];
    copy.sort((left, right) => {
      const leftValue = left?.[sort.key];
      const rightValue = right?.[sort.key];
      return compareValues(leftValue, rightValue, sort.direction);
    });
    return copy;
  }, [sort.direction, sort.key, users]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sortedUsers;

    return sortedUsers.filter((user) =>
      [user.name, user.emailId, user.phone, user.typeLabel, user.genderLabel].some(
        (value) => String(value || '').toLowerCase().includes(keyword)
      )
    );
  }, [search, sortedUsers]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const pagedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const onSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortLabel = (key) => {
    if (sort.key !== key) return '';
    return sort.direction === 'asc' ? '▲' : '▼';
  };

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
                    <div>
                      <h2 className={styles.title}>유저관리</h2>
                      <p className={styles.subTitle}>
                        등록된 사용자 목록을 확인하고, 검색과 정렬로 빠르게 찾을
                        수 있습니다.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="이름, 이메일, 휴대번호, 사용자 유형 검색"
                      style={{
                        minWidth: 260,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #d5dbea',
                      }}
                    />
                  </div>

                  <div
                    className={styles.surveyBox}
                    style={{ marginBottom: 18 }}
                  >
                    <p className={styles.surveyTitle}>전체 사용자 {users.length}명</p>
                    <p className={styles.desc} style={{ marginBottom: 0 }}>
                      {search.trim()
                        ? `검색 결과 ${filteredUsers.length}명을 표시하고 있습니다.`
                        : '사용자 유형, 이름, 나이, 성별, 연락처를 한눈에 확인해보세요.'}
                    </p>
                  </div>

                  {loading && (
                    <p className={styles.desc}>
                      유저 목록을 불러오는 중입니다.
                    </p>
                  )}
                  {!loading && error && (
                    <p className={styles.errorText}>{error}</p>
                  )}

                  {!loading && !error && (
                    <div className={styles.adminTableWrap}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('typeLabel')}
                              >
                                사용자 유형 {sortLabel('typeLabel')}
                              </button>
                            </th>
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('name')}
                              >
                                이름 {sortLabel('name')}
                              </button>
                            </th>
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('age')}
                              >
                                나이 {sortLabel('age')}
                              </button>
                            </th>
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('genderLabel')}
                              >
                                성별 {sortLabel('genderLabel')}
                              </button>
                            </th>
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('emailId')}
                              >
                                이메일 {sortLabel('emailId')}
                              </button>
                            </th>
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('phone')}
                              >
                                휴대번호 {sortLabel('phone')}
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedUsers.length === 0 ? (
                            <tr>
                              <td colSpan="6" className={styles.emptyCell}>
                                조회된 사용자가 없습니다.
                              </td>
                            </tr>
                          ) : (
                            pagedUsers.map((user) => (
                              <tr key={user.userNo || user.emailId}>
                                <td>
                                  <span
                                    onClick={() => handleTypeClick(user)}
                                    style={{
                                      cursor:
                                        user.type === 'ADMIN' ? 'default' : 'pointer',
                                    }}
                                  >
                                    {user.typeLabel}
                                  </span>
                                </td>
                                <td>{user.name || '-'}</td>
                                <td>{user.age ?? '-'}</td>
                                <td>{user.genderLabel}</td>
                                <td>{user.emailId || '-'}</td>
                                <td>{user.phone || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!loading && !error && filteredUsers.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 8,
                        marginTop: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        type="button"
                        className={styles.inlineBtn}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1}
                      >
                        이전
                      </button>

                      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                        (pageNumber) => (
                          <button
                            key={pageNumber}
                            type="button"
                            className={`${styles.inlineBtn} ${
                              pageNumber === currentPage ? styles.inlineBtnActive : ''
                            }`}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className={styles.inlineBtn}
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage >= totalPages}
                      >
                        다음
                      </button>
                    </div>
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
