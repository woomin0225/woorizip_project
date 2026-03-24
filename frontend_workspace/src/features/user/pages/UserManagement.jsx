import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import { getAdminUserListPage } from '../api/userAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 100;

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
  const [sort, setSort] = useState({ key: 'userNo', direction: 'asc' });

  const handleTypeClick = (user) => {
    const type = String(user.type || '').toUpperCase();
    const state = { targetUserNo: user.userNo, targetUserType: type };

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
          const list = await getAdminUserListPage(page, PAGE_SIZE);
          const currentPageItems = Array.isArray(list) ? list : [];
          collected.push(...currentPageItems);
          if (currentPageItems.length < PAGE_SIZE) break;
          page += 1;
        }

        if (cancelled) return;

        const normalized = collected.map((user) => {
          const birthDate = normalizeBirthDate(
            pickFirst(user?.birthDate, user?.birth_date)
          );
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
            type: user?.type || '',
            typeLabel: userTypeLabel(user?.type),
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
                    <h2 className={styles.title}>유저관리</h2>
                    <p className={styles.subTitle}>
                      등록된 전체 사용자 목록을 확인하고, 항목명을 눌러 정렬할
                      수 있습니다.
                    </p>
                  </div>

                  <div
                    className={styles.surveyBox}
                    style={{ marginBottom: 18 }}
                  >
                    <p className={styles.surveyTitle}>
                      전체 사용자 {users.length}명
                    </p>
                    <p className={styles.desc} style={{ marginBottom: 0 }}>
                      이름, 나이, 성별, 유저번호 등 주요 정보를 한눈에
                      확인해보세요.
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
                                onClick={() => onSort('userNo')}
                              >
                                유저번호 {sortLabel('userNo')}
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
                            <th>
                              <button
                                type="button"
                                className={styles.sortBtn}
                                onClick={() => onSort('typeLabel')}
                              >
                                회원유형 {sortLabel('typeLabel')}
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedUsers.length === 0 ? (
                            <tr>
                              <td colSpan="7" className={styles.emptyCell}>
                                조회된 사용자가 없습니다.
                              </td>
                            </tr>
                          ) : (
                            sortedUsers.map((user) => (
                              <tr key={user.userNo || user.emailId}>
                                <td>
                                  <span
                                    onClick={() => handleTypeClick(user)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {user.userNo ?? '-'}
                                  </span>
                                </td>
                                <td>{user.name || '-'}</td>
                                <td>{user.age ?? '-'}</td>
                                <td>{user.genderLabel}</td>
                                <td>{user.emailId || '-'}</td>
                                <td>{user.phone || '-'}</td>
                                <td>{user.typeLabel}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
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
