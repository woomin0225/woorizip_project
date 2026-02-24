import React, { useEffect, useRef } from 'react';
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
} from 'reactstrap';
import DemoNavbar from '../components/Navbars/DemoNavbar.js';
import SimpleFooter from '../components/Footers/SimpleFooter.js';

export default function FindId() {
  const mainRef = useRef(null);
  const { form, foundId, loading, handleChange, handleFindId } = useFindId();

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
                      <small>아이디 찾기</small>
                    </div>
                    <Form onSubmit={handleFindId}>
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
                            placeholder="휴대폰 번호"
                            value={form.phone}
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
                          {loading ? '찾는 중...' : '아이디 찾기'}
                        </Button>
                      </div>
                    </Form>
                    {foundId && (
                      <div className="alert alert-success mt-3 text-center">
                        <small>찾은 아이디: {foundId}</small>
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
