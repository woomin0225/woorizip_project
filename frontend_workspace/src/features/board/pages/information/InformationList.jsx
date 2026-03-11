// src/features/board/pages/Information/InformationList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostList from '../../components/PostList';
import { useInformationList } from '../../hooks/useInformationList';
import styles from './InformationList.module.css';

export default function InformationList() {
  const nav = useNavigate();
  const hook = useInformationList();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>정책・정보</h1>
          <p className={styles.subtitle}>주거 정책과 생활 정보를 확인하세요.</p>
        </div>

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
            onClickWrite={() => nav('/information/new')}
            onClickRow={(postNo) => nav(`/information/${postNo}`)}
            setPage={hook.setPage}
          />
        </div>
      </div>
    </div>
  );
}
