// src/features/board/components/PostList.jsx
import React from 'react';
import PostListItem from './PostListItem';
import PostSearchBar from './PostSearchBar';
import PagingView from './../../../shared/components/PagingView/PagingView';

export default function PostList({
  title,
  isAdmin,
  isAuthed,
  content,
  pageResponse,
  loading,
  error,

  search,
  setSearch,
  onSubmitSearch,
  onReset,
  onChangeType,

  onClickWrite,
  onClickRow,
  setPage,

  onTogglePin,
  ListItemComponent = PostListItem, // 기본값
}) {
  return (
    <div style={{ padding: 16 }}>
      <h2
        style={{
          textAlign: 'center',
          color: '#2f9d27',
          fontSize: 42,
          margin: '18px 0',
        }}
      >
        {title}
      </h2>

      {(isAdmin || isAuthed) && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <button type="button" onClick={onClickWrite}>
            글 등록
          </button>
        </div>
      )}

      <PostSearchBar
        search={search}
        setSearch={setSearch}
        onSubmit={onSubmitSearch}
        onReset={onReset}
        onChangeType={onChangeType}
      />

      {loading && <div style={{ textAlign: 'center' }}>Loading...</div>}
      {error && (
        <div style={{ textAlign: 'center', color: 'crimson' }}>{error}</div>
      )}

      <table
        width="100%"
        border="1"
        cellPadding="8"
        style={{ borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th width="10%">번호</th>
            <th>제목</th>
            <th width="15%">작성자</th>
            <th width="15%">등록일</th>
            <th width="10%">조회수</th>
          </tr>
        </thead>

        <tbody>
          {content.length === 0 ? (
            <tr>
              <td colSpan="5" align="center">
                게시글이 없습니다.
              </td>
            </tr>
          ) : (
            content.map((post) => (
              <ListItemComponent
                key={post.postNo}
                post={post}
                isAdmin={isAdmin}
                onTogglePin={onTogglePin}
                onClick={() => onClickRow(post.postNo)}
              />
            ))
          )}
        </tbody>
      </table>

      {pageResponse && (
        <div style={{ marginTop: 16 }}>
          <PagingView pageResponse={pageResponse} onChangePage={setPage} />
        </div>
      )}
    </div>
  );
}
