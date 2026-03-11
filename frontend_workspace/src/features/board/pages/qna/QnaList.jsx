// src/features/board/pages/qna/QnaList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../../components/PostList';
import { useQnaList } from '../../hooks/useQnaList';
import styles from './QnaList.module.css';

export default function QnaList() {
  const nav = useNavigate();
  const hook = useQnaList();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Q&A</h1>
          <p className={styles.subtitle}>
            궁금한 내용을 질문하고 답변을 확인하세요.
          </p>
        </div>

        <div className={styles.card}>
          <PostList
            title=""
            isAdmin={false}
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
        </div>
      </div>
    </div>
  );
}
