import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../../app/layouts/MyPageLayout.module.css';

const MENUS = [
  { label: '내정보 보기', to: '/mypage/info' },
  { label: '내정보 수정', to: '/mypage/edit' },
  { label: '찜목록', to: '/wishlist' },
  { label: '신청현황', to: '/tour/list' },
  { label: '계약 내역', to: '/contract/list' },
  { label: '회원탈퇴', to: '/mypage/withdraw' },
];

export default function MyPageSideNav() {
  const location = useLocation();

  return (
    <>
      <h4 className={styles.menuTitle}>마이페이지</h4>
      <nav className={styles.menuList}>
        {MENUS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className={`${styles.menuItem} ${active ? styles.active : ''}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

