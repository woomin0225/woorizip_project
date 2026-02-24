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
import DemoNavbar from '../components/Navbars/DemoNavbar.js';

export default function FindId() {
  const mainRef = useRef(null);
  const [validated, setValidated] = useState(false);
  const {
    form,
    foundId,
    loading,
    error,
    isCodeSent,
    isVerified,
    handleChange,
    handleSendCode,
    handleVerifyCode,
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
                              onClick={handleSendCode}
                              disabled={isVerified}
                            >
                              {isCodeSent ? '재발송' : '인증요청'}
                            </Button>
                            <FormFeedback>번호를 입력해 주세요.</FormFeedback>
                          </InputGroup>
                        </FormGroup>
                        {isCodeSent && !isVerified && (
                          <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                              <InputGroupText>
                                <i className="fa fa-check" />
                              </InputGroupText>
                              <Input
                                name="code"
                                type="text"
                                placeholder="인증번호 4자리"
                                value={form.code}
                                onChange={handleChange}
                              />
                              <Button
                                color="success"
                                size="sm"
                                type="button"
                                onClick={handleVerifyCode}
                              >
                                확인
                              </Button>
                            </InputGroup>
                          </FormGroup>
                        )}
                        {isVerified && (
                          <div className="text-success text-center mb-3">
                            <small>
                              <i className="fa fa-check-circle" /> 휴대폰 인증이
                              완료되었습니다.
                            </small>
                          </div>
                        )}
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
                        <Button color="info" outline block href="/login">
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
