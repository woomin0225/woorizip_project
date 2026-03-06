import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Headroom from 'headroom.js';
import { ROUTES } from './../../../shared/constants/routes';
import logo from '../../../logo.png';
import { axiosInstance } from '../../http/axiosInstance';
import { useAuth } from '../../providers/AuthProvider';

import {
  Button,
  UncontrolledCollapse,
  NavbarBrand,
  Navbar,
  NavItem,
  NavLink,
  Nav,
  Container,
  Row,
  Col,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

import styles from './Header.module.css';

export default function Header() {
  const LARGE_VIEW_KEY = 'ui-large-view';
  const { clearTokens } = useAuth();
  const [isLessor, setIsLessor] = useState(false);
  const [collapseClasses, setCollapseClasses] = useState('');
  const [userName, setUserName] = useState('');
  const [isLargeView, setIsLargeView] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [myPageRoute, setMyPageRoute] = useState(ROUTES.MEMBER.MYPAGE);

  const token = localStorage.getItem('accessToken');
  const isLoggedIn = !!token;

  useEffect(() => {
    const saved = localStorage.getItem(LARGE_VIEW_KEY) === '1';
    setIsLargeView(saved);
    document.body.classList.toggle('large-view', saved);
  }, []);

  const toggleLargeView = () => {
    setIsLargeView((prev) => {
      const next = !prev;
      localStorage.setItem(LARGE_VIEW_KEY, next ? '1' : '0');
      document.body.classList.toggle('large-view', next);
      return next;
    });
  };

  useEffect(() => {
    const syncUserState = () => {
      if (!token) return;

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
        const decodedToken = JSON.parse(jsonPayload);

        // ✅ LESSOR 여부 확인: /api/user/{emailId} 호출해서 type 체크
        setIsLessor(false); // 기본값

        const emailId = decodedToken.emailId || decodedToken.sub; // 보통 sub에 이메일 들어있음
        if (emailId) {
          axiosInstance
            .get(`/api/user/${encodeURIComponent(emailId)}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
              const userDto = res?.data?.data; // ApiResponse<UserDto>에서 data
              setIsLessor(userDto?.type === 'LESSOR');
            })
            .catch((err) => {
              console.error('회원정보 조회 실패:', err);
              setIsLessor(false);
            });
        }

        const isAdmin =
          decodedToken.role === 'ADMIN' ||
          decodedToken.role === 'ROLE_ADMIN' ||
          decodedToken.auth === 'ADMIN' ||
          decodedToken.auth === 'ROLE_ADMIN';

        setMyPageRoute(isAdmin ? ROUTES.ADMIN.MEMBERS : ROUTES.MEMBER.MYPAGE);

        const latestName =
          localStorage.getItem('userName') || decodedToken.name || '고객';
        setUserName(latestName);
      } catch (e) {
        console.error('토큰 파싱 에러:', e);
      }
    };

    syncUserState();
    window.addEventListener('profile-updated', syncUserState);
    window.addEventListener('storage', syncUserState);

    return () => {
      window.removeEventListener('profile-updated', syncUserState);
      window.removeEventListener('storage', syncUserState);
    };
  }, [token]);

  useEffect(() => {
    // Route change can leave navbar-collapse overlay classes behind on mobile.
    setCollapseClasses('');
    const collapseEl = document.querySelector('.navbar-collapse');
    if (!collapseEl) return;
    collapseEl.classList.remove('show', 'collapsing', 'collapsing-out');
    collapseEl.style.height = '';
  }, [location.pathname]);

  // useEffect(() => {
  //   let headroom = new Headroom(document.getElementById('navbar-main'));
  //   headroom.init();
  // }, []);

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('userName');
    localStorage.removeItem('userNo');
    alert('로그아웃 되었습니다.');
    navigate('/');
    window.location.reload();
  };

  return (
    <header className={styles.headerGlobal}>
      <Navbar
        className={`navbar-main navbar-light headroom ${styles.navbar}`}
        expand="lg"
        id="navbar-main"
      >
        <Container fluid className={styles.inner}>
          <NavbarBrand className="mr-lg-5" to="/" tag={Link}>
            <img src={logo} alt="우리집 로고" style={{ height: '40px' }} />
          </NavbarBrand>

          <button className="navbar-toggler" id="navbar_global">
            <span className="navbar-toggler-icon" />
          </button>

          <UncontrolledCollapse
            toggler="#navbar_global"
            navbar
            className={collapseClasses}
            onExiting={() => setCollapseClasses('collapsing-out')}
            onExited={() => setCollapseClasses('')}
          >
            <div className="navbar-collapse-header">
              <Row>
                <Col className="collapse-brand" xs="6">
                  <Link to="/">
                    <span className="font-weight-bold ml-2 text-info">
                      우리집
                    </span>
                  </Link>
                </Col>
                <Col className="collapse-close" xs="6">
                  <button className="navbar-toggler" id="navbar_global">
                    <span />
                    <span />
                  </button>
                </Col>
              </Row>
            </div>

            <Nav
              className="navbar-nav-hover align-items-lg-center mx-auto"
              navbar
            >
              <NavItem>
                <NavLink to="/about" tag={Link}>
                  소개
                </NavLink>
              </NavItem>
              <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret>
                  게시판
                </DropdownToggle>

                <DropdownMenu>
                  <DropdownItem tag={Link} to="/notices">
                    공지사항
                  </DropdownItem>
                  <DropdownItem tag={Link} to="/event">
                    이벤트
                  </DropdownItem>
                  <DropdownItem tag={Link} to="/qna">
                    QnA
                  </DropdownItem>
                  <DropdownItem tag={Link} to="/information">
                    정책・정보
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
              <NavItem>
                <NavLink to="/rooms" tag={Link}>
                  방찾기
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/facility/view" tag={Link}>
                  공용시설
                </NavLink>
              </NavItem>
              {isLoggedIn && isLessor && (
                <NavItem>
                  <NavLink to="/estate/manage" tag={Link}>
                    매물관리
                  </NavLink>
                </NavItem>
              )}
            </Nav>

            <Nav className="align-items-lg-center ml-lg-auto" navbar>
              <NavItem className={styles.zoomItem}>
                <Button
                  className={`${styles.zoomButton} ${
                    isLargeView ? styles.zoomButtonActive : ''
                  }`}
                  color={isLargeView ? 'info' : 'secondary'}
                  size="sm"
                  onClick={toggleLargeView}
                >
                  크게보기
                </Button>
              </NavItem>

              {isLoggedIn ? (
                <NavItem
                  className={`d-none d-lg-flex ${styles.authSlot} ${styles.authSlotLoggedIn}`}
                >
                  <span className={styles.welcomeText}>
                    {userName}님 환영합니다!
                  </span>
                  <div className={styles.authButtonsRow}>
                    <Button
                      className={`btn-neutral btn-icon ${styles.loggedInButton}`}
                      color="default"
                      size="sm"
                      to={myPageRoute}
                      tag={Link}
                    >
                      <span className="nav-link-inner--text">마이페이지</span>
                    </Button>

                    <Button
                      className={`btn-info btn-icon ${styles.loggedInButton}`}
                      color="default"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <span className="nav-link-inner--text">로그아웃</span>
                    </Button>
                  </div>
                </NavItem>
              ) : (
                <NavItem
                  className={`d-none d-lg-flex ${styles.authSlot} ${styles.authSlotLoggedOut}`}
                >
                  <div className={styles.authButtonsRow}>
                    <Button
                      className="btn-neutral btn-icon"
                      color="default"
                      size="sm"
                      to="/login"
                      tag={Link}
                    >
                      <span className="nav-link-inner--text">로그인</span>
                    </Button>
                    <Button
                      className="btn-info btn-icon"
                      color="default"
                      size="sm"
                      to="/signup"
                      tag={Link}
                    >
                      <span className="nav-link-inner--text">회원가입</span>
                    </Button>
                  </div>
                </NavItem>
              )}
            </Nav>
          </UncontrolledCollapse>
        </Container>
      </Navbar>
    </header>
  );
}
