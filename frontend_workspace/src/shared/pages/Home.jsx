// src/shared/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import styles from './Home.module.css';

import { fetchNoticeTop3 } from '../../features/notice/api/noticeApi';
import { fetchBoardTop3 } from '../../features/board/api/boardApi';

// ApiResponse<List<...>> 또는 배열 반환 모두 대응
function unwrapList(resp) {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.data)) return resp.data;
  if (Array.isArray(resp?.data?.data)) return resp.data.data; // ApiResponse {data: [...] } 형태도 대응
  if (Array.isArray(resp?.data?.content)) return resp.data.content;
  return [];
}

// 날짜 필드 유연 대응
function pickNoticeDate(n) {
  return n?.noticeDate ?? n?.enrollDate ?? n?.createdAt ?? '';
}

export default function Home() {
  const [ntop3, setNtop3] = useState([]);
  const [btop3, setBtop3] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const [nResp, bResp] = await Promise.all([
          fetchNoticeTop3(),
          fetchBoardTop3(),
        ]);

        if (!alive) return;

        setNtop3(unwrapList(nResp).slice(0, 3));
        setBtop3(unwrapList(bResp).slice(0, 3));
      } catch (e) {
        if (!alive) return;
        setError('Top3 데이터를 불러오지 못했습니다.');
        setNtop3([]);
        setBtop3([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div className={styles.container}>Loading.....</div>;
  }

  return (
    <div className={styles.container}>
      {error && (
        <div style={{ color: 'crimson', marginBottom: 10 }}>{error}</div>
      )}

      <div className={styles.content}>
        {/* left : Notice Top3 */}
        <section className={styles.section}>
          <h2>최신 공지</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              {ntop3.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    데이터 없음
                  </td>
                </tr>
              ) : (
                ntop3.map((item) => (
                  <tr key={item.noticeNo}>
                    <td>{item.noticeNo}</td>
                    <td>
                      <Link
                        to={`/notices/${item.noticeNo}`}
                        className={styles.link}
                      >
                        {item.noticeTitle}
                      </Link>
                    </td>
                    <td>{item.noticeWriter}</td>
                    <td>{pickNoticeDate(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* right : Board Top3 */}
        <section className={styles.section}>
          <h2>인기 게시글</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>조회수</th>
              </tr>
            </thead>
            <tbody>
              {btop3.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    데이터 없음
                  </td>
                </tr>
              ) : (
                btop3.map((item) => (
                  <tr key={item.boardNum}>
                    <td>{item.boardNum}</td>
                    <td>
                      <Link
                        to={`/boards/${item.boardNum}`}
                        className={styles.link}
                      >
                        {item.boardTitle}
                      </Link>
                    </td>
                    <td>{item.boardWriter}</td>
                    <td>{item.boardReadCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
