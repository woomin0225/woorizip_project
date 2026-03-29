import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../../../app/config/env';
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
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const redirectTo = (() => {
    const from = location.state?.from;
    if (!from) return '/';
    if (typeof from === 'string') return from;
    return `${from.pathname || '/'}${from.search || ''}${from.hash || ''}`;
  })();
  const { form, loading, error, handleChange, handleLogin } = useLogin(
    redirectTo
  );
  const [validated, setValidated] = useState(false);
  const backendBaseUrl = getApiBaseUrl();

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
    sessionStorage.setItem('postLoginRedirect', redirectTo);
    const backendUrl = `${backendBaseUrl}/oauth2/authorization/${provider}`;
    window.location.href = backendUrl;
  };

  return (
    <>
      <main ref={mainRef}>
        <section
          className={`section section-shaped section-lg ${styles.heroSection}`}
        >
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
                            <i className="fa fa-envelope" />
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
                            <i className="fa fa-lock" />
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
                          className={`my-4 ${styles.primaryActionBtn}`}
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
                        className={`btn-neutral btn-icon ${styles.socialBtn}`}
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
                        className={`btn-neutral btn-icon ${styles.socialBtn}`}
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
