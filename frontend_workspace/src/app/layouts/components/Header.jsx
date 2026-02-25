import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Headroom from 'headroom.js';
import { ROUTES } from './../../../shared/constants/routes';
import logo from '../../../logo.png';

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
} from 'reactstrap';

export default function Header() {
  const [collapseClasses, setCollapseClasses] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const [myPageRoute, setMyPageRoute] = useState(ROUTES.MEMBER.MYPAGE);

  const token = localStorage.getItem('accessToken');
  const isLoggedIn = !!token;

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
    let headroom = new Headroom(document.getElementById('navbar-main'));
    headroom.init();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userName');
    alert('로그아웃 되었습니다.');
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="header-global">
      <Navbar
        className="navbar-main navbar-transparent navbar-light headroom"
        expand="lg"
        id="navbar-main"
      >
        <Container>
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
              <NavItem>
                <NavLink to="/board" tag={Link}>
                  게시판
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/rooms" tag={Link}>
                  방찾기
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/facilities" tag={Link}>
                  공용시설
                </NavLink>
              </NavItem>
            </Nav>

            <Nav className="align-items-lg-center ml-lg-auto" navbar>
              {isLoggedIn ? (
                <NavItem className="d-none d-lg-flex flex-column align-items-end ml-lg-4">
                  <span
                    className="text-white mb-1 font-weight-bold"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {userName}님 환영합니다!
                  </span>
                  <div>
                    <Button
                      className="btn-neutral btn-icon"
                      color="default"
                      size="sm"
                      to={myPageRoute}
                      tag={Link}
                    >
                      <span className="nav-link-inner--text">마이페이지</span>
                    </Button>
                    <Button
                      className="btn-warning btn-icon ml-2"
                      color="default"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <span className="nav-link-inner--text">로그아웃</span>
                    </Button>
                  </div>
                </NavItem>
              ) : (
                <NavItem className="d-none d-lg-block ml-lg-4">
                  <Button
                    className="btn-neutral btn-icon mr-2"
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
                </NavItem>
              )}
            </Nav>
          </UncontrolledCollapse>
        </Container>
      </Navbar>
    </header>
  );
}
