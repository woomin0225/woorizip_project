import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../../app/layouts/MyPageLayout.module.css';
import { getMyInfo, isLessorType } from '../api/userAPI';

const BASE_MENUS = [
  { label: '마이페이지', to: '/mypage' },
  { label: '내정보 보기', to: '/mypage/info' },
  { label: '내정보 수정', to: '/mypage/edit' },
  { label: '찜목록', to: '/wishlist' },
  { label: '신청현황', to: '/tour/list', lessorLabel: '승인현황' },
  { label: '계약 내역', to: '/contract/list' },
];

const WITHDRAW_MENU = { label: '회원탈퇴', to: '/mypage/withdraw' };

export default function MyPageSideNav() {
  const location = useLocation();
  const [isLessor, setIsLessor] = React.useState(false);
  const withdrawActive = location.pathname === WITHDRAW_MENU.to;
  const menus = React.useMemo(
    () =>
      BASE_MENUS.map((menu) => ({
        ...menu,
        label: isLessor && menu.lessorLabel ? menu.lessorLabel : menu.label,
      })),
    [isLessor]
  );

  React.useEffect(() => {
    let mounted = true;
    getMyInfo()
      .then((info) => {
        if (!mounted) return;
        setIsLessor(isLessorType(info?.type));
      })
      .catch(() => {
        if (!mounted) return;
        setIsLessor(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.sideNavWrap}>
      <nav className={styles.menuList}>
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
