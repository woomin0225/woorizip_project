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
import styles from './Signup.module.css';

export default function Signup() {
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const [validated, setValidated] = useState(false);

  const {
    form,
    loading,
    error,
    isIdChecked,
    isPhoneVerified,
    isPhoneVerifying,
    phoneVerificationError,
    phoneVerifiedPhone,
    handleChange,
    handleCheckId,
    handleSendPhoneCode,
    handleResetPhoneVerification,
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
      !form.passwordConfirm ||
      !form.name ||
      !form.phone ||
      !form.rrnFront ||
      !form.rrnBack
    ) {
      setValidated(true);
      return;
    }
    handleSubmit(e, navigate);
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
              <Col lg="8">
                <Card className="bg-secondary shadow border-0">
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-center text-muted mb-4">
                      <small>회원가입</small>
                    </div>
                    <Form role="form" noValidate onSubmit={onSignupSubmit}>
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>계정 정보</h4>
                        <div className={styles.sectionBody}>
                          <FormGroup className={styles.narrowInputWrap}>
                            <label className="form-control-label">
                              <small>이메일 아이디</small>
                            </label>
                            <div className={styles.inlineInputAction}>
                              <InputGroup className="input-group-alternative mb-0">
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
                                <FormFeedback>
                                  이메일을 입력해 주세요.
                                </FormFeedback>
                              </InputGroup>
                              <Button
                                color={isIdChecked ? 'success' : 'info'}
                                type="button"
                                onClick={handleCheckId}
                                className={`${styles.inlineActionBtn} ${isIdChecked ? styles.doneActionBtn : styles.primaryActionBtn}`}
                              >
                                {isIdChecked ? '확인완료' : '중복확인'}
                              </Button>
                            </div>
                          </FormGroup>
                          <FormGroup className={`mb-0 ${styles.typeField}`}>
                            <label className="form-control-label">
                              <small>계정유형</small>
                            </label>
                            <div className={styles.typePills}>
                              <button
                                type="button"
                                className={`${styles.typePill} ${form.type === 'USER' ? styles.typePillActive : ''}`}
                                onClick={() =>
                                  handleChange({
                                    target: { name: 'type', value: 'USER' },
                                  })
                                }
                              >
                                일반 사용자
                              </button>
                              <button
                                type="button"
                                className={`${styles.typePill} ${form.type === 'LESSOR' ? styles.typePillActive : ''}`}
                                onClick={() =>
                                  handleChange({
                                    target: { name: 'type', value: 'LESSOR' },
                                  })
                                }
                              >
                                임대인
                              </button>
                            </div>
                          </FormGroup>
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>비밀번호 설정</h4>
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
                                8~16자 영문, 숫자, 특수문자를 모두 포함해야
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
                      </div>

                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          기본정보 및 본인확인
                        </h4>
                        <div className={styles.sectionBody}>
                          <FormGroup className={styles.narrowInputWrap}>
                            <label className="form-control-label">
                              <small>이름</small>
                            </label>
                            <InputGroup className="input-group-alternative mb-0">
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

                          <FormGroup className={styles.rrnWrap}>
                            <label className="form-control-label">
                              <small>주민등록번호</small>
                            </label>
                            <InputGroup className="input-group-alternative mb-0">
                              <Input
                                name="rrnFront"
                                placeholder="앞 6자리"
                                type="text"
                                maxLength={6}
                                value={form.rrnFront}
                                onChange={handleChange}
                                invalid={validated && !form.rrnFront}
                              />
                              <InputGroupText>-</InputGroupText>
                              <Input
                                className={styles.rrnBackInput}
                                name="rrnBack"
                                placeholder="뒤 1자리"
                                type="password"
                                maxLength={1}
                                value={form.rrnBack}
                                onChange={handleChange}
                                invalid={validated && !form.rrnBack}
                              />
                              <InputGroupText className={styles.rrnMask}>
                                ******
                              </InputGroupText>
                            </InputGroup>
                          </FormGroup>

                          <FormGroup className={styles.narrowInputWrap}>
                            <label className="form-control-label">
                              <small>휴대폰번호</small>
                            </label>
                            <div className={styles.inlineInputAction}>
                              <InputGroup className="input-group-alternative mb-0">
                                <InputGroupText>
                                  <i className="ni ni-mobile-button" />
                                </InputGroupText>
                                <Input
                                  name="phone"
                                  placeholder="휴대폰번호"
                                  type="text"
                                  value={form.phone}
                                  onChange={handleChange}
                                  invalid={validated && !form.phone}
                                />
                                <FormFeedback>
                                  휴대폰번호를 입력해 주세요.
                                </FormFeedback>
                              </InputGroup>
                              <Button
                                color={isPhoneVerified ? 'success' : 'info'}
                                type="button"
                                onClick={handleSendPhoneCode}
                                disabled={isPhoneVerifying}
                                className={`${styles.inlineActionBtn} ${isPhoneVerified ? styles.doneActionBtn : styles.primaryActionBtn}`}
                              >
                                {isPhoneVerifying
                                  ? '인증 중...'
                                  : isPhoneVerified
                                    ? '인증완료'
                                    : '본인 인증'}
                              </Button>
                            </div>
                          </FormGroup>

                          {isPhoneVerified && (
                            <FormGroup className={styles.narrowInputWrap}>
                              <div className={styles.inlineInputAction}>
                                <div className="text-success">
                                  <small>
                                    휴대폰 확인이 완료되었습니다.
                                    {phoneVerifiedPhone
                                      ? ` (${phoneVerifiedPhone})`
                                      : ''}
                                  </small>
                                </div>
                                <Button
                                  color="secondary"
                                  type="button"
                                  onClick={handleResetPhoneVerification}
                                  className={`${styles.inlineActionBtn} ${styles.softActionBtn}`}
                                >
                                  초기화
                                </Button>
                              </div>
                            </FormGroup>
                          )}
                          {phoneVerificationError && (
                            <div className="text-danger">
                              <small>{phoneVerificationError}</small>
                            </div>
                          )}
                        </div>
                      </div>

                      {error && (
                        <div className="text-danger text-center mt-2 mb-2">
                          <small>{error}</small>
                        </div>
                      )}

                      <div className="text-center">
                        <Button
                          className={`mt-4 ${styles.primaryActionBtn}`}
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
