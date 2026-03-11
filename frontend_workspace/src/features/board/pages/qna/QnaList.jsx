// src/features/board/pages/qna/QnaList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../../components/PostList';
import { useQnaList } from '../../hooks/useQnaList';

export default function QnaList() {
  const nav = useNavigate();
  const hook = useQnaList();

  return (
    <PostList
      title="Q&A 게시글 목록"
      isAdmin={false} // Q&A는 일반 사용자도 사용 가능
      isAuthed={hook.isAuthed}
      content={hook.content}
      pageResponse={hook.pageResponse}
      loading={hook.loading}
      error={hook.err}
      search={hook.search}
      setSearch={hook.setSearch}
      onSubmitSearch={hook.onSubmitSearch}
      onReset={hook.onReset}
      onChangeType={hook.onChangeType}
      onClickWrite={() => nav('/qna/new')}
      onClickRow={(postNo) => nav(`/qna/${postNo}`)}
      setPage={hook.setPage}
    />
  );
}
