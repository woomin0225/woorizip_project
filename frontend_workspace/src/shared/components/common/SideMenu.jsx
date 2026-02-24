// src/shared/components/common/SideMenu.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './SideMenu.module.css';

import { useAuth } from '../../../app/providers/AuthProvider';
import { logout } from '../../../features/auth/api/authApi';

export default function SideMenu({ open, onClose }) {
  const navigate = useNavigate();
  const { isAuthed, isAdmin, userId, clearTokens } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearTokens();
      onClose?.();
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sideMenu} ${open ? '' : styles.closed}`}>
        <ul className={styles.menuList}>
          {/* 사용자 + 로그아웃 + 닫기 한 줄 */}
          {isAuthed && (
            <li className={styles.userRow}>
              <span className={styles.userName}>{userId} 님</span>

              <div className={styles.userActions}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  로그아웃
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={styles.closeButtonInline}
                >
                  닫기
                </button>
              </div>
            </li>
          )}

          {!isAuthed && (
            <>
              <li>
                <Link
                  to="/login"
                  onClick={onClose}
                  className={styles.clickable}
                >
                  로그인
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className={styles.clickable}
                >
                  회원가입
                </Link>
              </li>
            </>
          )}

          <li>
            <Link to="/notices" onClick={onClose} className={styles.clickable}>
              공지사항
            </Link>
          </li>

          <li>
            <Link to="/boards" onClick={onClose} className={styles.clickable}>
              게시판
            </Link>
          </li>

          {isAuthed && (
            <li>
              <Link to="/mypage" onClick={onClose} className={styles.clickable}>
                마이페이지
              </Link>
            </li>
          )}

          {isAdmin && (
            <li>
              <Link
                to="/admin/members"
                onClick={onClose}
                className={styles.clickable}
              >
                회원관리
              </Link>
            </li>
          )}
        </ul>
      </aside>
    </>
  );
}
