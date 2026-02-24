import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../hooks/useUserHooks';
import {
  Button,
  Card,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupText,
  InputGroup,
  Container,
  Row,
  Col,
} from 'reactstrap';
import DemoNavbar from '../components/Navbars/DemoNavbar.js';
import SimpleFooter from '../components/Footers/SimpleFooter.js';

export default function Login() {
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { form, loading, error, handleChange, handleLogin } = useLogin();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <DemoNavbar />
      <main ref={mainRef}>
        <section className="section section-shaped section-lg">
          <div className="shape shape-style-1 bg-gradient-info">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <Container className="pt-lg-7">
            <Row className="justify-content-center">
              <Col lg="5">
                <Card className="bg-secondary shadow border-0">
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-center text-muted mb-4">
                      <small>로그인</small>
                    </div>
                    <Form
                      role="form"
                      onSubmit={(e) => handleLogin(e, navigate)}
                    >
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupText>
                            <i className="ni ni-email-83" />
                          </InputGroupText>
                          <Input
                            name="emailId"
                            placeholder="이메일 아이디"
                            type="email"
                            value={form.emailId}
                            onChange={handleChange}
                            required
                          />
                        </InputGroup>
                      </FormGroup>
                      <FormGroup>
                        <InputGroup className="input-group-alternative">
                          <InputGroupText>
                            <i className="ni ni-lock-circle-open" />
                          </InputGroupText>
                          <Input
                            name="password"
                            placeholder="비밀번호"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                          />
                        </InputGroup>
                      </FormGroup>
                      {error && (
                        <div className="text-danger text-center mb-3">
                          <small>{error}</small>
                        </div>
                      )}
                      <div className="text-center">
                        <Button
                          className="my-4"
                          color="info"
                          type="submit"
                          disabled={loading}
                          block
                        >
                          {loading ? '로그인 중...' : '로그인'}
                        </Button>
                      </div>
                    </Form>
                  </CardBody>
                </Card>
                <Row className="mt-3">
                  <Col xs="6">
                    <Link className="text-light" to="/find-password">
                      <small>비밀번호 찾기</small>
                    </Link>
                  </Col>
                  <Col className="text-right" xs="6">
                    <Link className="text-light" to="/signup">
                      <small>회원가입</small>
                    </Link>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
      <SimpleFooter />
    </>
  );
}
