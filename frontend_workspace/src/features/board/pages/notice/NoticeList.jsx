// src/features/board/pages/notice/NoticeList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../../components/PostList';
import { useNoticeList } from '../../hooks/useNoticeList';
import styles from './NoticeList.module.css';

export default function NoticeList() {
  const nav = useNavigate();
  const hook = useNoticeList();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>공지사항</h1>
          <p className={styles.subtitle}>안내 및 운영 공지를 확인하세요.</p>
        </div>

        {/* 컨테이너 */}
        <div className={styles.card}>
          <PostList
            title=""
            isAdmin={hook.isAdmin}
            content={hook.content}
            pageResponse={hook.pageResponse}
            loading={hook.loading}
            error={hook.err}
            search={hook.search}
            setSearch={hook.setSearch}
            onSubmitSearch={hook.onSubmitSearch}
            onReset={hook.onReset}
            onChangeType={hook.onChangeType}
            onClickWrite={() => nav('/notices/new')}
            onClickRow={(postNo) => nav(`/notices/${postNo}`)}
            onTogglePin={hook.togglePin}
            setPage={hook.setPage}
          />
        </div>
      </div>
    </div>
  );
}
