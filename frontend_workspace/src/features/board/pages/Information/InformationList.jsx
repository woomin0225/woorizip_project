// src/features/board/pages/Information/InformationList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../../components/PostList';
import { useInformationList } from '../../hooks/useInformationList';

export default function InformationList() {
  const nav = useNavigate();
  const hook = useInformationList();

  return (
    <PostList
      title="정책・정보 게시글 목록"
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
      onClickWrite={() => nav('/information/new')}
      onClickRow={(postNo) => nav(`/information/${postNo}`)}
      setPage={hook.setPage}
    />
  );
}
