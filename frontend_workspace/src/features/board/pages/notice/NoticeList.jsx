// src/features/board/pages/notice/NoticeList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../../components/PostList';
import { useNoticeList } from '../../hooks/useNoticeList';

export default function NoticeList() {
  const nav = useNavigate();
  const hook = useNoticeList();

  return (
    <PostList
      title="공지 목록"
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
      setPage={hook.setPage}
    />
  );
}
