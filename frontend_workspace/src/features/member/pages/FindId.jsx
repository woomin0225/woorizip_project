// src/features/user/pages/FindId.jsx
import React from 'react';
import { useFindId } from '../hooks/useUserHooks';
import styles from './FindId.module.css';

export default function FindId() {
  const { form, foundId, loading, handleChange, handleFindId } = useFindId();

  return (
    <div className={styles.container}>
      <h2>아이디 찾기</h2>
      <form onSubmit={handleFindId} className={styles.form}>
        <div className={styles.group}>
          <label>이름</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.group}>
          <label>전화번호</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading} className={styles.btn}>
          {loading ? '찾는 중...' : '아이디 찾기'}
        </button>
      </form>
      {foundId && <div className={styles.result}>찾은 아이디: {foundId}</div>}
    </div>
  );
}
