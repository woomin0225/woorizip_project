import React, { useEffect, useRef } from 'react';
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
} from 'reactstrap';
import DemoNavbar from '../components/Navbars/DemoNavbar.js';
import SimpleFooter from '../components/Footers/SimpleFooter.js';

export default function Signup() {
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { form, loading, error, handleChange, handleSubmit } = useSignup();

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
              <Col lg="8">
                <Card className="bg-secondary shadow border-0">
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-center text-muted mb-4">
                      <small>회원가입</small>
                    </div>
                    <Form
                      role="form"
                      onSubmit={(e) => handleSubmit(e, navigate)}
                    >
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
                                required
                              />
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
                                required
                              />
                            </InputGroup>
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
                                required
                              />
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
                                required
                              />
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
                                required
                              />
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
                            />
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
      <SimpleFooter />
    </>
  );
}
