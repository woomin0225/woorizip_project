import React from 'react';
import { NavItem, NavLink, Nav, Container, Row, Col, Button } from 'reactstrap';

export default function SimpleFooter() {
  return (
    <footer className="footer">
      <Container>
        <Row className="align-items-center justify-content-md-between">
          <Col md="6">
            <div className="copyright">
              © 2026{' '}
              <a href="/" target="_blank" rel="noopener noreferrer">
                Woorizip (우리집)
              </a>
              . All rights reserved.
            </div>
          </Col>
          <Col md="6">
            <Nav className="nav-footer justify-content-end">
              <NavItem>
                <NavLink href="/about">About Us</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/blog">Blog</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/license">MIT License</NavLink>
              </NavItem>
            </Nav>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
