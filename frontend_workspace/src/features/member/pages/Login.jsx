import React, { useEffect, useRef, useState } from 'react';
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
  FormFeedback,
} from 'reactstrap';
import DemoNavbar from '../components/Navbars/DemoNavbar.js';

export default function Login() {
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { form, loading, error, handleChange, handleLogin } = useLogin();
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onLoginSubmit = (e) => {
    e.preventDefault();
    if (!form.emailId || !form.password) {
      setValidated(true);
      return;
    }
    handleLogin(e, navigate);
  };

  const handleSocialLogin = (provider) => {
    const backendUrl = `http://localhost:8080/oauth2/authorization/${provider}`;
    window.location.href = backendUrl;
  };

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
                      <small>이메일로 로그인</small>
                    </div>
                    <Form role="form" noValidate onSubmit={onLoginSubmit}>
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
                            invalid={validated && !form.emailId}
                          />
                          <FormFeedback>이메일을 입력해 주세요.</FormFeedback>
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
                            invalid={validated && !form.password}
                          />
                          <FormFeedback>비밀번호를 입력해 주세요.</FormFeedback>
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
                  <div className="card-footer bg-white pb-4 text-center border-0 pt-0">
                    <hr className="mt-0 mb-4" />
                    <div className="text-muted text-center mb-3">
                      <small>또는 소셜 계정으로 로그인</small>
                    </div>
                    <div className="btn-wrapper text-center">
                      <Button
                        className="btn-neutral btn-icon"
                        color="default"
                        onClick={() => handleSocialLogin('google')}
                      >
                        <span
                          className="btn-inner--text font-weight-bold"
                          style={{ color: '#ea4335' }}
                        >
                          Google
                        </span>
                      </Button>
                      <Button
                        className="btn-neutral btn-icon"
                        color="default"
                        onClick={() => handleSocialLogin('kakao')}
                      >
                        <span className="btn-inner--text text-warning font-weight-bold">
                          Kakao
                        </span>
                      </Button>
                    </div>
                  </div>
                </Card>
                <Row className="mt-3">
                  <Col xs="4" className="text-left">
                    <Link className="text-light" to="/find-id">
                      <small>아이디 찾기</small>
                    </Link>
                  </Col>
                  <Col xs="4" className="text-center">
                    <Link className="text-light" to="/find-password">
                      <small>비밀번호 찾기</small>
                    </Link>
                  </Col>
                  <Col xs="4" className="text-right">
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
    </>
  );
}
