// src/app/layouts/components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

import { useAuth } from '../../../app/providers/AuthProvider';
import { logout } from '../../../features/auth/api/authApi';

//  SideMenu 위치가 다르면 이 import 경로만 프로젝트 구조에 맞게 바꾸세요.
import SideMenu from '../../../shared/components/common/SideMenu';

export default function Header() {
  const navigate = useNavigate();
  const { isAuthed, isAdmin, clearTokens } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    try {
      await logout();
    } finally {
      clearTokens();
      setMenuOpen(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <>
      <header className={styles.header}>
        {/* 좌측: 로고 */}
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logoLink} aria-label="home">
            <span className={styles.logoText}>FIRST</span>
          </Link>
        </div>

        {/* 중앙: 공지/게시판 + (로그인)마이페이지 + (관리자)회원관리 */}
        <nav className={styles.centerNav} aria-label="main navigation">
          <ul className={styles.navList}>
            <li>
              <Link to="/notices" className={styles.navItem}>
                공지
              </Link>
            </li>

            <li>
              <Link to="/boards" className={styles.navItem}>
                게시판
              </Link>
            </li>

            {isAuthed && (
              <li>
                <Link to="/mypage" className={styles.navItem}>
                  마이페이지
                </Link>
              </li>
            )}

            {isAdmin && (
              <li>
                <Link to="/admin/members" className={styles.navItem}>
                  회원관리
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* 우측: 인증 버튼 + 햄버거 */}
        <div className={styles.rightSection}>
          {!isAuthed ? (
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.navItem}>
                로그인
              </Link>
              <span className={styles.separator}>|</span>
              <Link to="/signup" className={styles.navItem}>
                회원가입
              </Link>
            </div>
          ) : (
            <button
              type="button"
              className={styles.authButton}
              onClick={onLogout}
            >
              로그아웃
            </button>
          )}

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* 사이드메뉴 */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
