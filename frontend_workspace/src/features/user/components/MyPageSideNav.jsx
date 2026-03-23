import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../../app/layouts/MyPageLayout.module.css';
import { getIsLessorHint, getMyInfo, isLessorType } from '../api/userAPI';
import { useAuth } from '../../../app/providers/AuthProvider';

const BASE_MENUS = [
  { label: '내정보 보기', to: '/mypage/info' },
  { label: '내정보 수정', to: '/mypage/edit' },
  { label: '찜목록', to: '/wishlist' },
  { label: '신청현황', to: '/tour/list', lessorLabel: '승인현황' },
  { label: '계약현황', to: '/contract/list' },
];

const WITHDRAW_MENU = { label: '회원탈퇴', to: '/mypage/withdraw' };
const ADMIN_MENU = { label: '유저관리', to: '/mypage/users' };

export default function MyPageSideNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [isLessor, setIsLessor] = React.useState(() => getIsLessorHint());
  const withdrawActive = location.pathname === WITHDRAW_MENU.to;
  const menus = React.useMemo(() => {
    const baseMenus = BASE_MENUS.map((menu) => ({
      ...menu,
      label:
        menu.lessorLabel && isLessor === null
          ? '신청/승인현황'
          : isLessor && menu.lessorLabel
            ? menu.lessorLabel
            : menu.label,
    }));

    return isAdmin ? [...baseMenus, ADMIN_MENU] : baseMenus;
  }, [isAdmin, isLessor]);

  React.useEffect(() => {
    let mounted = true;
    getMyInfo()
      .then((info) => {
        if (!mounted) return;
        const nextIsLessor = isLessorType(info?.type);
        setIsLessor(nextIsLessor);
        if (info?.type) {
          localStorage.setItem('userType', String(info.type));
          sessionStorage.setItem('userType', String(info.type));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsLessor((prev) => (prev === null ? false : prev));
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.sideNavWrap}>
      <div className={styles.sideNavHeader}>
        <p className={styles.menuTitle}>마이페이지</p>
        <div className={styles.menuDivider} aria-hidden="true" />
      </div>
      <nav className={styles.menuList} aria-label="마이페이지 메뉴">
        {menus.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.menuItem} ${active ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.withdrawWrap}>
        <Link
          to={WITHDRAW_MENU.to}
          className={`${styles.withdrawItem} ${withdrawActive ? styles.withdrawActive : ''}`}
        >
          {WITHDRAW_MENU.label}
        </Link>
      </div>
    </div>
  );
}
