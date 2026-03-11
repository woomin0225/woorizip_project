// src/shared/components/PagingView/PagingView.jsx
import React from 'react';
import styles from './PagingView.module.css';

export default function PagingView({ pageResponse, onChangePage }) {
  if (!pageResponse) return null;

  const { page, totalPages } = pageResponse;
  if (!totalPages || totalPages <= 1) return null;

  const current = page || 1;

  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className={styles.pagingContainer}>
      {' '}
      {/* ✅ 인라인 제거 */}
      <button
        className={styles.btn}
        disabled={current <= 1}
        onClick={() => onChangePage(1)}
      >
        처음
      </button>
      <button
        className={styles.btn}
        disabled={current <= 1}
        onClick={() => onChangePage(current - 1)}
      >
        이전
      </button>
      {start > 1 && <span className={styles.ellipsis}>…</span>}
      {pages.map((p) => (
        <button
          key={p}
          className={`${styles.btn} ${p === current ? styles.active : ''}`}
          onClick={() => onChangePage(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className={styles.ellipsis}>…</span>}
      <button
        className={styles.btn}
        disabled={current >= totalPages}
        onClick={() => onChangePage(current + 1)}
      >
        다음
      </button>
      <button
        className={styles.btn}
        disabled={current >= totalPages}
        onClick={() => onChangePage(totalPages)}
      >
        끝
      </button>
    </div>
  );
}
