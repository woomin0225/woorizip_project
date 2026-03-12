// src/app/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';


import styles from './MainLayout.module.css';
import Header from './components/Header';
import Footer from './components/Footer';
import OrchestrateQuickAgent from '../../features/aiAssistant/components/OrchestrateQuickAgent';

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
      <OrchestrateQuickAgent />
    </div>
  );
}
