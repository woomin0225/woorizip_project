// src/features/board/pages/event/EventList.jsx

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
      <div
        style={{
          marginBottom: 18,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: '#2b2b2b',
          }}
        >
          이벤트
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: '#666',
          }}
        >
          진행 중인 이벤트와 혜택 정보를 확인하세요.
        </p>
      </div>

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
            isAdmin={hook.isAdmin}
            toggling={hook.togglingPostNo === post.postNo}
            onToggleVisibility={hook.toggleVisibility}
            onClick={() => nav(`/event/${post.postNo}`)}
          />
        ))}
      </div>

      {/* 페이징 */}
      <div
        style={{
          position: 'relative',
          marginTop: 30,
          minHeight: 40,
        }}
      >
        {hook.pageResponse && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <PagingView
              pageResponse={hook.pageResponse}
              onChangePage={hook.setPage}
            />
          </div>
        )}

        {hook.isAdmin && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => nav('/event/new')}
              style={{
                height: 36,
                padding: '0 14px',
                border: '1px solid #c9713f',
                background: '#c9713f',
                color: '#fff',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              글 등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
