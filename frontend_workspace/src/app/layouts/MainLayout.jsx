// src/app/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

import Header from '../../shared/components/common/Header';
import Footer from '../../shared/components/common/Footer';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  return (
    <div className={styles.wrapper}>
      {/* 상단 헤더 */}
      <Header />

      {/* 본문 영역 */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* 하단 푸터 */}
      <Footer />
    </div>
  );
}
