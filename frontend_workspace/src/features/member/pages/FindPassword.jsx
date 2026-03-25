import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindPassword } from '../hooks/useUserHooks';
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
import styles from './FindPassword.module.css';

export default function FindPassword() {
  const mainRef = useRef(null);
  const navigate = useNavigate();
  const {
    form,
    loading,
    error,
    message,
    isVerified,
    isVerifying,
    verificationError,
    verifiedPhone,
    handleChange,
    handleSendCode,
    handleResetVerification,
    handleRequestNewPassword,
  } = useFindPassword();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (e) => {
    const changed = await handleRequestNewPassword(e);
    if (changed) {
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    }
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
                      <small>이름, 아이디, 휴대폰 번호를 확인한 뒤 새 비밀번호를 설정해 주세요.</small>
                    </div>
                    <Form onSubmit={onSubmit}>
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupText>
                            <i className="fa fa-user" />
                          </InputGroupText>
                          <Input
                            name="name"
                            type="text"
                            placeholder="이름 입력"
                            value={form.name}
                            onChange={handleChange}
                            disabled={isVerified}
                            required
                          />
                        </InputGroup>
                      </FormGroup>
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupText>
                            <i className="fa fa-envelope" />
                          </InputGroupText>
                          <Input
                            name="emailId"
                            type="email"
                            placeholder="가입한 아이디 입력"
                            value={form.emailId}
                            onChange={handleChange}
                            disabled={isVerified}
                            required
                          />
                        </InputGroup>
                      </FormGroup>
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupText>
                            <i className="fa fa-mobile" />
                          </InputGroupText>
                          <Input
                            name="phone"
                            type="text"
                            placeholder="가입한 휴대폰 번호 입력"
                            value={form.phone}
                            onChange={handleChange}
                            disabled={isVerified}
                            required
                          />
                          <Button
                            color="info"
                            outline
                            size="sm"
                            type="button"
                            className={`${styles.inlineActionBtn} ${isVerified ? styles.doneActionBtn : styles.primaryActionBtn}`}
                            onClick={handleSendCode}
                            disabled={loading || isVerified || isVerifying}
                          >
                            {isVerifying
                              ? '인증 중...'
                              : isVerified
                                ? '인증완료'
                                : '휴대폰 확인'}
                          </Button>
                        </InputGroup>
                      </FormGroup>
                      {isVerified && (
                        <>
                          <div className={styles.verifiedSummary}>
                            <div className={styles.verifiedTitle}>휴대폰 확인이 완료되었습니다.</div>
                            {verifiedPhone && (
                              <div className={styles.verifiedPhone}>{verifiedPhone}</div>
                            )}
                            <Button
                              color="secondary"
                              size="sm"
                              type="button"
                              className={styles.softActionBtn}
                              onClick={handleResetVerification}
                            >
                              다시 확인하기
                            </Button>
                          </div>
                          <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                              <InputGroupText>
                                <i className="fa fa-lock" />
                              </InputGroupText>
                              <Input
                                name="newPassword"
                                type="password"
                                placeholder="새 비밀번호 입력"
                                value={form.newPassword}
                                onChange={handleChange}
                                required
                              />
                            </InputGroup>
                          </FormGroup>
                          <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                              <InputGroupText>
                                <i className="fa fa-lock" />
                              </InputGroupText>
                              <Input
                                name="newPasswordConfirm"
                                type="password"
                                placeholder="새 비밀번호 확인"
                                value={form.newPasswordConfirm}
                                onChange={handleChange}
                                required
                              />
                            </InputGroup>
                          </FormGroup>
                        </>
                      )}
                      <div className="text-center">
                        <Button
                          className={`my-4 ${styles.primaryActionBtn}`}
                          color="info"
                          type="submit"
                          disabled={loading || !isVerified}
                          block
                        >
                          {loading ? '처리 중...' : '새 비밀번호로 변경'}
                        </Button>
                      </div>
                    </Form>
                    {error && (
                      <div className="alert alert-danger mt-3">
                        <small>{error}</small>
                      </div>
                    )}
                    {verificationError && (
                      <div className="alert alert-danger mt-3">
                        <small>{verificationError}</small>
                      </div>
                    )}
                    {message && (
                      <div className="alert alert-success mt-3">
                        <small>{message}</small>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
    </>
  );
}
