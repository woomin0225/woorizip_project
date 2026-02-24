// src/features/board/components/PostSearchBar.jsx
import React from 'react';

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
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 14,
      }}
    >
      {/* 검색 타입 */}
      <select value={search.type} onChange={handleTypeChange}>
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* 키워드 검색 */}
      {search.type !== 'date' ? (
        <input
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

      <button type="submit">검색</button>
      <button type="button" onClick={onReset}>
        초기화
      </button>
    </form>
  );
}
