import React, { useEffect, useRef, useState } from 'react';
import { useFindId } from '../hooks/useUserHooks';
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
import styles from './FindId.module.css';

export default function FindId() {
  const mainRef = useRef(null);
  const [validated, setValidated] = useState(false);
  const {
    form,
    foundId,
    loading,
    error,
    isVerified,
    isVerifying,
    verificationError,
    verifiedPhone,
    handleChange,
    handleSendCode,
    handleResetVerification,
    handleFindId,
  } = useFindId();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onFindSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !isVerified) {
      setValidated(true);
      return;
    }
    handleFindId(e);
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
                      <small>아이디 찾기</small>
                    </div>
                    {!foundId ? (
                      <Form role="form" noValidate onSubmit={onFindSubmit}>
                        <FormGroup className="mb-3">
                          <InputGroup className="input-group-alternative">
                            <InputGroupText>
                              <i className="fa fa-user" />
                            </InputGroupText>
                            <Input
                              name="name"
                              type="text"
                              placeholder="이름"
                              value={form.name}
                              onChange={handleChange}
                              invalid={validated && !form.name}
                              disabled={isVerified}
                            />
                            <FormFeedback>이름을 입력해 주세요.</FormFeedback>
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
                              placeholder="휴대폰 번호"
                              value={form.phone}
                              onChange={handleChange}
                              invalid={validated && !form.phone}
                              disabled={isVerified}
                            />
                            <Button
                              color="info"
                              outline
                              size="sm"
                              type="button"
                              className={`${styles.inlineActionBtn} ${isVerified ? styles.doneActionBtn : styles.primaryActionBtn}`}
                              onClick={handleSendCode}
                              disabled={isVerified || isVerifying}
                            >
                              {isVerifying
                                ? '인증 중...'
                                : isVerified
                                  ? '인증완료'
                                  : '본인 인증'}
                            </Button>
                            <FormFeedback>번호를 입력해 주세요.</FormFeedback>
                          </InputGroup>
                        </FormGroup>
                        {isVerified && (
                          <div className="text-success text-center mb-3">
                            <small>
                              <i className="fa fa-check-circle" /> 휴대폰 확인이
                              완료되었습니다.
                              {verifiedPhone ? ` (${verifiedPhone})` : ''}
                            </small>
                            <div className="mt-2">
                              <Button
                                color="secondary"
                                size="sm"
                                type="button"
                                className={`${styles.inlineActionBtn} ${styles.softActionBtn}`}
                                onClick={handleResetVerification}
                              >
                                인증 초기화
                              </Button>
                            </div>
                          </div>
                        )}
                        {verificationError && (
                          <div className="text-danger text-center mb-3">
                            <small>{verificationError}</small>
                          </div>
                        )}
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
                            disabled={loading || !isVerified}
                            block
                          >
                            {loading ? '찾는 중...' : '아이디 찾기'}
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4">
                          <i className="fa fa-search fa-3x text-info" />
                        </div>
                        <p>고객님의 이메일 아이디를 찾았습니다.</p>
                        <h4 className="display-4 text-primary mb-4">
                          {foundId}
                        </h4>
                        <Button
                          color="info"
                          outline
                          block
                          href="/login"
                          className={styles.primaryActionBtn}
                        >
                          로그인하기
                        </Button>
                        <Button color="link" block href="/find-password">
                          비밀번호 찾기
                        </Button>
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
