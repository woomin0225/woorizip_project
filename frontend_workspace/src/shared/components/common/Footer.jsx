// src/shared/components/common/Footer.jsx
import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <h3 className={styles.logo}>FIRST</h3>
          <p className={styles.description}>
            AI · Spring Boot · React 기반 웹 프로젝트 실습 플랫폼
          </p>
        </div>

        <div className={styles.center}>
          <p>공지 | 게시판 | 마이페이지 | 회원관리</p>
        </div>

        <div className={styles.right}>
          <p>© {new Date().getFullYear()} first_front</p>
          <p>All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
