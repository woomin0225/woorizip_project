import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Headroom from 'headroom.js';
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

export default function DemoNavbar() {
  const [collapseClasses, setCollapseClasses] = useState('');
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('accessToken');
  const userName = '사용자';

  useEffect(() => {
    let headroom = new Headroom(document.getElementById('navbar-main'));
    headroom.init();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    alert('로그아웃 되었습니다.');
    navigate('/');
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
            <span
              className="text-white font-weight-bold"
              style={{ fontSize: '1.2rem' }}
            >
              우리집
            </span>
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

            <Nav className="navbar-nav-hover align-items-lg-center" navbar>
              <NavItem>
                <NavLink to="/about" tag={Link}>
                  웹사이트 소개
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
                <NavItem className="d-none d-lg-block ml-lg-4">
                  <span className="text-white mr-3 font-weight-bold">
                    {userName} 님 환영합니다!
                  </span>
                  <Button
                    className="btn-neutral btn-icon"
                    color="default"
                    to="/user-info"
                    tag={Link}
                  >
                    <span className="nav-link-inner--text">마이페이지</span>
                  </Button>
                  <Button
                    className="btn-warning btn-icon ml-2"
                    color="default"
                    onClick={handleLogout}
                  >
                    <span className="nav-link-inner--text">로그아웃</span>
                  </Button>
                </NavItem>
              ) : (
                <NavItem className="d-none d-lg-block ml-lg-4">
                  <Button
                    className="btn-neutral btn-icon mr-2"
                    color="default"
                    to="/login"
                    tag={Link}
                  >
                    <span className="nav-link-inner--text">로그인</span>
                  </Button>
                  <Button
                    className="btn-info btn-icon"
                    color="default"
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
