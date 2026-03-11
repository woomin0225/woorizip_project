// src/features/board/components/PostSearchBar.jsx
import React from 'react';
import styles from './PostSearchBar.module.css';

export default function PostSearchBar({
  search,
  setSearch,
  onSubmit,
  onReset,
  onChangeType,
  types = [
    { value: 'title', label: '제목' },
    { value: 'content', label: '내용' },
    { value: 'date', label: '등록기간' },
  ],
}) {
  const handleTypeChange = (e) => {
    const nextType = e.target.value;
    if (onChangeType) return onChangeType(nextType);

    // fallback
    setSearch((prev) => ({
      ...prev,
      type: nextType,
    }));
  };

  return (
    <form onSubmit={onSubmit} className={styles.bar}>
      <select
        className={styles.select}
        value={search.type}
        onChange={handleTypeChange}
      >
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {search.type !== 'date' ? (
        <input
          className={styles.input}
          value={search.keyword || ''}
          onChange={(e) =>
            setSearch((prev) => ({
              ...prev,
              keyword: e.target.value,
            }))
          }
          placeholder="검색어"
        />
      ) : (
        <>
          <input
            className={styles.date}
            type="date"
            value={search.begin || ''}
            onChange={(e) =>
              setSearch((prev) => ({
                ...prev,
                begin: e.target.value,
              }))
            }
          />
          <input
            className={styles.date}
            type="date"
            value={search.end || ''}
            onChange={(e) =>
              setSearch((prev) => ({
                ...prev,
                end: e.target.value,
              }))
            }
          />
        </>
      )}

      <button type="submit" className={`${styles.btn} ${styles.primary}`}>
        검색
      </button>

      <button type="button" className={styles.btn} onClick={onReset}>
        초기화
      </button>
    </form>
  );
}
