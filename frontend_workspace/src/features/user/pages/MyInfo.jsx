// src/features/user/pages/UserInfo.jsx
import React from 'react';
import { useUserInfo } from '../hooks/useUserHooks';
import styles from './UserInfo.module.css';

export default function UserInfo() {
  const currentUserNo = 'dummy-user-no'; // 실제로는 Context나 LocalStorage에서 획득
  const { form, loading, handleChange, handleUpdate } =
    useUserInfo(currentUserNo);

  if (loading) return <div>정보를 불러오는 중입니다...</div>;

  return (
    <div className={styles.container}>
      <h2>내 정보 조회 및 수정</h2>
      <form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.group}>
          <label>이메일 아이디 (수정 불가)</label>
          <input name="emailId" value={form.emailId} readOnly />
        </div>
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
        <button type="submit" className={styles.btn}>
          정보 수정
        </button>
      </form>
    </div>
  );
}
