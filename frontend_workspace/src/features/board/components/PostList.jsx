// src/features/board/components/PostList.jsx
import React from 'react';
import PostListItem from './PostListItem';
import PostSearchBar from './PostSearchBar';
import PagingView from './../../../shared/components/PagingView/PagingView';
import styles from './PostList.module.css';

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
    <div className={styles.wrap}>
      <PostSearchBar
        search={search}
        setSearch={setSearch}
        onSubmit={onSubmitSearch}
        onReset={onReset}
        onChangeType={onChangeType}
      />

      {loading && <div className={styles.loading}>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={`${styles.th} ${styles.center}`}
                style={{ width: '10%' }}
              >
                번호
              </th>
              <th className={styles.th}>제목</th>
              <th
                className={`${styles.th} ${styles.center}`}
                style={{ width: '15%' }}
              >
                작성자
              </th>
              <th
                className={`${styles.th} ${styles.center}`}
                style={{ width: '15%' }}
              >
                등록일
              </th>
              <th
                className={`${styles.th} ${styles.center}`}
                style={{ width: '10%' }}
              >
                조회수
              </th>
            </tr>
          </thead>

          <tbody>
            {content.length === 0 ? (
              <tr>
                <td className={`${styles.td} ${styles.center}`} colSpan="5">
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
      </div>

      <div className={styles.footerRow}>
        {pageResponse && (
          <div className={styles.paging}>
            <PagingView pageResponse={pageResponse} onChangePage={setPage} />
          </div>
        )}

        {(isAdmin || isAuthed) && (
          <div className={styles.bottomActions}>
            <button
              type="button"
              className={styles.writeBtn}
              onClick={onClickWrite}
            >
              글 등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
