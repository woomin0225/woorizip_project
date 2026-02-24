import React, { useEffect, useRef } from 'react';
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
import DemoNavbar from '../components/Navbars/DemoNavbar.js';
import SimpleFooter from '../components/Footers/SimpleFooter.js';

export default function FindPassword() {
  const mainRef = useRef(null);
  const {
    method,
    setMethod,
    form,
    loading,
    message,
    handleChange,
    handleRequestNewPassword,
  } = useFindPassword();

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
                      <small>비밀번호 찾기</small>
                    </div>
                    <div className="d-flex justify-content-center mb-4">
                      <div className="custom-control custom-radio mr-4">
                        <input
                          type="radio"
                          id="methodEmail"
                          className="custom-control-input"
                          checked={method === 'email'}
                          onChange={() => setMethod('email')}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor="methodEmail"
                        >
                          이메일 인증
                        </label>
                      </div>
                      <div className="custom-control custom-radio">
                        <input
                          type="radio"
                          id="methodPhone"
                          className="custom-control-input"
                          checked={method === 'phone'}
                          onChange={() => setMethod('phone')}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor="methodPhone"
                        >
                          휴대폰 인증
                        </label>
                      </div>
                    </div>
                    <Form onSubmit={handleRequestNewPassword}>
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupText>
                            <i
                              className={
                                method === 'email'
                                  ? 'fa fa-envelope'
                                  : 'fa fa-mobile'
                              }
                            />
                          </InputGroupText>
                          <Input
                            name={method === 'email' ? 'emailId' : 'phone'}
                            type={method === 'email' ? 'email' : 'text'}
                            placeholder={
                              method === 'email'
                                ? '가입한 이메일 입력'
                                : '가입한 휴대폰 번호 입력'
                            }
                            value={
                              method === 'email' ? form.emailId : form.phone
                            }
                            onChange={handleChange}
                            required
                          />
                        </InputGroup>
                      </FormGroup>
                      <div className="text-center">
                        <Button
                          className="my-4"
                          color="info"
                          type="submit"
                          disabled={loading}
                          block
                        >
                          {loading
                            ? '요청 처리 중...'
                            : '임시 비밀번호 발급 요청'}
                        </Button>
                      </div>
                    </Form>
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
      <SimpleFooter />
    </>
  );
}
