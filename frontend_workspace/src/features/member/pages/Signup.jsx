import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../hooks/useUserHooks';
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

export default function Signup() {
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const [validated, setValidated] = useState(false);

  const {
    form,
    loading,
    error,
    isIdChecked,
    handleChange,
    handleCheckId,
    handleSubmit,
  } = useSignup();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSignupSubmit = (e) => {
    e.preventDefault();
    if (
      !form.emailId ||
      !form.password ||
      !form.name ||
      !form.phone ||
      !form.birthDate
    ) {
      setValidated(true);
      return;
    }
    handleSubmit(e, navigate);
  };

  return (
    <>
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
              <Col lg="8">
                <Card className="bg-secondary shadow border-0">
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-center text-muted mb-4">
                      <small>회원가입</small>
                    </div>
                    <Form role="form" noValidate onSubmit={onSignupSubmit}>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <label className="form-control-label">
                              <small>계정유형</small>
                            </label>
                            <Input
                              type="select"
                              name="type"
                              className="form-control-alternative"
                              value={form.type}
                              onChange={handleChange}
                            >
                              <option value="USER">일반 사용자</option>
                              <option value="LESSOR">임대인</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <label className="form-control-label">
                              <small>이메일 아이디</small>
                            </label>
                            <InputGroup className="input-group-alternative mb-3">
                              <InputGroupText>
                                <i className="ni ni-email-83" />
                              </InputGroupText>
                              <Input
                                name="emailId"
                                placeholder="이메일"
                                type="email"
                                value={form.emailId}
                                onChange={handleChange}
                                invalid={validated && !form.emailId}
                              />
                              <Button
                                color={isIdChecked ? 'success' : 'info'}
                                type="button"
                                onClick={handleCheckId}
                                className="m-0 px-3"
                              >
                                {isIdChecked ? '확인완료' : '중복확인'}
                              </Button>
                              <FormFeedback>
                                이메일을 입력해 주세요.
                              </FormFeedback>
                            </InputGroup>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md="6">
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
                              <FormFeedback>
                                비밀번호를 입력해 주세요.
                              </FormFeedback>
                            </InputGroup>
                            <small className="text-muted mt-2 d-block">
                              ※ 8~16자 영문, 숫자, 특수문자를 모두 포함해야
                              합니다.
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <InputGroup className="input-group-alternative">
                              <InputGroupText>
                                <i className="ni ni-lock-circle-open" />
                              </InputGroupText>
                              <Input
                                name="passwordConfirm"
                                placeholder="비밀번호 확인"
                                type="password"
                                value={form.passwordConfirm}
                                onChange={handleChange}
                                invalid={validated && !form.passwordConfirm}
                              />
                              <FormFeedback>
                                비밀번호 확인을 입력해 주세요.
                              </FormFeedback>
                            </InputGroup>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <InputGroup className="input-group-alternative mb-3">
                              <InputGroupText>
                                <i className="ni ni-circle-08" />
                              </InputGroupText>
                              <Input
                                name="name"
                                placeholder="이름"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                invalid={validated && !form.name}
                              />
                              <FormFeedback>이름을 입력해 주세요.</FormFeedback>
                            </InputGroup>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <InputGroup className="input-group-alternative mb-3">
                              <InputGroupText>
                                <i className="ni ni-mobile-button" />
                              </InputGroupText>
                              <Input
                                name="phone"
                                placeholder="전화번호"
                                type="text"
                                value={form.phone}
                                onChange={handleChange}
                                invalid={validated && !form.phone}
                              />
                              <FormFeedback>
                                전화번호를 입력해 주세요.
                              </FormFeedback>
                            </InputGroup>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <label className="form-control-label d-block">
                              <small>성별</small>
                            </label>
                            <div className="custom-control custom-radio custom-control-inline">
                              <input
                                type="radio"
                                id="genderM"
                                name="gender"
                                className="custom-control-input"
                                value="M"
                                checked={form.gender === 'M'}
                                onChange={handleChange}
                              />
                              <label
                                className="custom-control-label"
                                htmlFor="genderM"
                              >
                                남
                              </label>
                            </div>
                            <div className="custom-control custom-radio custom-control-inline">
                              <input
                                type="radio"
                                id="genderF"
                                name="gender"
                                className="custom-control-input"
                                value="F"
                                checked={form.gender === 'F'}
                                onChange={handleChange}
                              />
                              <label
                                className="custom-control-label"
                                htmlFor="genderF"
                              >
                                여
                              </label>
                            </div>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <label className="form-control-label">
                              <small>생년월일</small>
                            </label>
                            <Input
                              name="birthDate"
                              type="date"
                              className="form-control-alternative"
                              value={form.birthDate}
                              onChange={handleChange}
                              invalid={validated && !form.birthDate}
                            />
                            <FormFeedback>
                              생년월일을 선택해 주세요.
                            </FormFeedback>
                          </FormGroup>
                        </Col>
                      </Row>
                      {error && (
                        <div className="text-danger text-center mt-2 mb-2">
                          <small>{error}</small>
                        </div>
                      )}
                      <div className="text-center">
                        <Button
                          className="mt-4"
                          color="info"
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? '가입 중...' : '계정 생성'}
                        </Button>
                      </div>
                    </Form>
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
