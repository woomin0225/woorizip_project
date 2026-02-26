import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';

export default function About() {
  return (
    <section className="section section-lg" style={{ paddingTop: 96 }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="8">
            <Card className="shadow border-0">
              <CardBody>
                <h2 style={{ marginBottom: 12 }}>소개</h2>
                <p style={{ marginBottom: 10 }}>
                  우리집 서비스 소개 페이지입니다.
                </p>
                <p style={{ marginBottom: 0, color: '#6b7280' }}>
                  현재는 임시 화면이며, 추후 서비스 특징/이용방법/문의 안내
                  내용으로 교체 예정입니다.
                </p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
