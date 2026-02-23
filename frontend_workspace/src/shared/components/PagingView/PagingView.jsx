// src/shared/components/PagingView/PagingView.jsx
import React from 'react';

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
    <div
      style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 16 }}
    >
      <button disabled={current <= 1} onClick={() => onChangePage(1)}>
        처음
      </button>
      <button disabled={current <= 1} onClick={() => onChangePage(current - 1)}>
        이전
      </button>

      {start > 1 && <span>…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChangePage(p)}
          style={{ fontWeight: p === current ? 'bold' : 'normal' }}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span>…</span>}

      <button
        disabled={current >= totalPages}
        onClick={() => onChangePage(current + 1)}
      >
        다음
      </button>
      <button
        disabled={current >= totalPages}
        onClick={() => onChangePage(totalPages)}
      >
        끝
      </button>
    </div>
  );
}
