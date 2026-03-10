import React from 'react';

function renderList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div style={{ marginTop: 8, color: '#6b7280' }}>없음</div>;
  }

  return (
    <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
      {items.map((item, idx) => (
        <li
          key={`${idx}-${String(item)}`}
          style={{ marginBottom: 6, lineHeight: 1.6 }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AiSummaryPanel({
  opened,
  hasLoaded,
  summaryLoading,
  summaryError,
  summaryData,
  onLoad,
  onToggle,
}) {
  const summary = summaryData?.summary || '';
  const keyPoints = summaryData?.keyPoints || [];
  const conclusion = summaryData?.conclusion || '';
  const schedules = summaryData?.schedules || [];
  const warnings = summaryData?.warnings || [];

  return (
    <section
      style={{
        marginTop: 24,
        marginBottom: 24,
        padding: 20,
        border: '1px solid #d8e9d1',
        borderRadius: 12,
        background: '#f8fff5',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 20 }}>AI 요약</h3>
          <div style={{ marginTop: 6, fontSize: 14, color: '#4b5563' }}>
            게시글 본문과 첨부자료를 함께 요약합니다.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onLoad} disabled={summaryLoading}>
            {summaryLoading
              ? '요약 생성 중...'
              : hasLoaded
                ? 'AI 요약 새로고침'
                : 'AI 요약 보기'}
          </button>

          {hasLoaded && (
            <button type="button" onClick={onToggle}>
              {opened ? '접기' : '펼치기'}
            </button>
          )}
        </div>
      </div>

      {summaryError && (
        <div style={{ marginTop: 16, color: 'crimson', fontWeight: 600 }}>
          {summaryError}
        </div>
      )}

      {opened && hasLoaded && !summaryLoading && (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {summary || '요약 결과가 없습니다.'}
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>핵심 내용</strong>
            {renderList(keyPoints)}
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>일정</strong>
            {renderList(schedules)}
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>결론</strong>
            <div style={{ marginTop: 8, lineHeight: 1.7, color: '#111827' }}>
              {conclusion || '없음'}
            </div>
          </div>

          {warnings.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <strong>주의</strong>
              {renderList(warnings)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
