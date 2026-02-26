// src/features/board/pages/event/eventList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventList } from '../../hooks/useEventList';
import EventListItem from '../../components/EventListItem';
import PostSearchBar from '../../components/PostSearchBar';
import PagingView from '../../../../shared/components/PagingView/PagingView';

export default function EventList() {
  const nav = useNavigate();
  const hook = useEventList();

  return (
    <div style={{ padding: 24 }}>
      {/* 제목 */}
      <h2
        style={{
          textAlign: 'center',
          color: '#2f9d27',
          fontSize: 40,
          marginBottom: 24,
        }}
      >
        이벤트 목록
      </h2>

      {/* 관리자 등록 버튼 */}
      {hook.isAdmin && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button onClick={() => nav('/event/new')}>이벤트 등록</button>
        </div>
      )}

      {/* 검색바 */}
      <PostSearchBar
        search={hook.search}
        setSearch={hook.setSearch}
        onSubmit={hook.onSubmitSearch}
        onReset={hook.onReset}
        onChangeType={hook.onChangeType}
      />

      {/* 로딩 / 에러 */}
      {hook.loading && <div style={{ textAlign: 'center' }}>Loading...</div>}

      {hook.err && (
        <div style={{ textAlign: 'center', color: 'crimson' }}>{hook.err}</div>
      )}

      {/* 카드 그리드 */}
      {!hook.loading && hook.content.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          등록된 이벤트가 없습니다.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 24,
          marginTop: 30,
        }}
      >
        {hook.content.map((post) => (
          <EventListItem
            key={post.postNo}
            post={post}
            onClick={() => nav(`/event/${post.postNo}`)}
          />
        ))}
      </div>

      {/* 페이징 */}
      {hook.pageResponse && (
        <div style={{ marginTop: 30 }}>
          <PagingView
            pageResponse={hook.pageResponse}
            onChangePage={hook.setPage}
          />
        </div>
      )}
    </div>
  );
}
