// About.jsx
import React from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Button } from 'reactstrap';

const FeatureCard = ({ icon, title, desc }) => (
  <Card className="shadow-sm border-0 h-100">
    <CardBody style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 122, 0, 0.12)',
            border: '1px solid rgba(255, 122, 0, 0.20)',
            boxShadow: '0 6px 16px rgba(17, 24, 39, 0.08)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        </div>
        <h5 style={{ margin: 0, fontWeight: 800 }}>{title}</h5>
      </div>
      <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
    </CardBody>
  </Card>
);

const MiniPoint = ({ title, items }) => (
  <Card className="shadow-sm border-0 h-100">
    <CardBody style={{ padding: 20 }}>
      <h5 style={{ marginBottom: 12, fontWeight: 800 }}>{title}</h5>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          color: '#374151',
          lineHeight: 1.8,
        }}
      >
        {items.map((v, idx) => (
          <li key={`${title}-${idx}`}>{v}</li>
        ))}
      </ul>
    </CardBody>
  </Card>
);

export default function About() {
  const brand = {
    primary: '#ff7a00',
    text: '#111827',
    sub: '#6b7280',
    bgSoft: 'rgba(255, 122, 0, 0.08)',
    line: 'rgba(17, 24, 39, 0.08)',
  };

  return (
    <section
      className="section section-lg"
      style={{ paddingTop: 96, paddingBottom: 72 }}
    >
      <Container>
        {/* HERO */}
        <Row className="justify-content-center" style={{ marginBottom: 28 }}>
          <Col lg="10">
            <Card className="shadow border-0" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  background: `linear-gradient(135deg, ${brand.bgSoft} 0%, rgba(255, 255, 255, 1) 55%)`,
                  borderBottom: `1px solid ${brand.line}`,
                }}
              >
                <CardBody style={{ padding: 28 }}>
                  <Badge
                    pill
                    style={{
                      background: brand.primary,
                      marginBottom: 12,
                      padding: '8px 12px',
                      fontWeight: 800,
                    }}
                  >
                    우리집 소개
                  </Badge>

                  <h1
                    style={{
                      margin: 0,
                      marginBottom: 10,
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      color: brand.text,
                    }}
                  >
                    코리빙 하우스를 한곳에서 찾고 비교하는 <br />
                    <span style={{ color: brand.primary }}>통합 플랫폼</span>
                  </h1>

                  <p
                    style={{
                      margin: 0,
                      color: brand.sub,
                      lineHeight: 1.7,
                      fontSize: 16,
                    }}
                  >
                    분산된 코리빙 하우스 정보를 통합 조회하고, 입주 및 공용시설
                    예약까지 한 공간에서 수행하는 단일 포털을 목표로 합니다.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 18,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      color="primary"
                      style={{
                        background: brand.primary,
                        borderColor: brand.primary,
                        fontWeight: 800,
                        borderRadius: 12,
                        padding: '10px 14px',
                      }}
                      onClick={() => (window.location.href = '/rooms')}
                    >
                      매물 보러가기
                    </Button>

                    <Button
                      outline
                      style={{
                        color: brand.text,
                        borderColor: 'rgba(17,24,39,0.20)',
                        fontWeight: 800,
                        borderRadius: 12,
                        padding: '10px 14px',
                      }}
                      onClick={() => {
                        const el = document.getElementById('about-features');
                        if (el)
                          el.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                      }}
                    >
                      주요 기능 보기
                    </Button>

                    <Button
                      outline
                      style={{
                        color: brand.text,
                        borderColor: 'rgba(17,24,39,0.20)',
                        fontWeight: 800,
                        borderRadius: 12,
                        padding: '10px 14px',
                      }}
                      onClick={() => {
                        const el = document.getElementById('about-diff');
                        if (el)
                          el.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                      }}
                    >
                      차별화 확인
                    </Button>
                  </div>
                </CardBody>
              </div>

              {/* quick stats */}
              <CardBody style={{ padding: 18 }}>
                <Row className="g-3">
                  <Col md="4">
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: `1px solid ${brand.line}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: brand.sub,
                          marginBottom: 6,
                        }}
                      >
                        핵심 목표
                      </div>
                      <div style={{ fontWeight: 900, color: brand.text }}>
                        코리빙 통합 포털
                      </div>
                    </div>
                  </Col>
                  <Col md="4">
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: `1px solid ${brand.line}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: brand.sub,
                          marginBottom: 6,
                        }}
                      >
                        문제 해결
                      </div>
                      <div style={{ fontWeight: 900, color: brand.text }}>
                        정보 분산·비교 어려움
                      </div>
                    </div>
                  </Col>
                  <Col md="4">
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: `1px solid ${brand.line}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: brand.sub,
                          marginBottom: 6,
                        }}
                      >
                        확장 방향
                      </div>
                      <div style={{ fontWeight: 900, color: brand.text }}>
                        커뮤니티·개인화
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* SECTION: 문제 -> 해결 */}
        <Row className="justify-content-center" style={{ marginBottom: 28 }}>
          <Col lg="10">
            <Row className="g-3">
              <Col md="6">
                <MiniPoint
                  title="현재 코리빙 탐색의 불편"
                  items={[
                    '정보가 여러 사이트에 흩어져 있음',
                    '매물 간 비교가 어려움',
                    '플랫폼별 정보 양식이 제각각',
                    '접근성/편의성이 낮은 경우가 많음',
                  ]}
                />
              </Col>
              <Col md="6">
                <MiniPoint
                  title="우리집이 해결합니다"
                  items={[
                    '분산된 코리빙 정보를 한곳에서 통합 조회',
                    '매물 간 비교 기능 제공',
                    '입주/투어/공용시설 예약까지 한 흐름으로',
                    '커뮤니티 기능으로 체류시간/재방문 강화',
                  ]}
                />
              </Col>
            </Row>
          </Col>
        </Row>

        {/* SECTION: 주요 기능 */}
        <Row className="justify-content-center" style={{ marginBottom: 14 }}>
          <Col lg="10">
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2
                  id="about-features"
                  style={{
                    margin: 0,
                    marginBottom: 6,
                    fontWeight: 900,
                    color: brand.text,
                  }}
                >
                  주요 기능
                </h2>
                <p style={{ margin: 0, color: brand.sub }}>
                  사용자가 실제로 “찾고 → 비교하고 → 신청/예약”까지 이어지는
                  흐름을 중심으로 구성했습니다.
                </p>
              </div>
              <Badge
                pill
                style={{
                  background: 'rgba(17,24,39,0.06)',
                  color: brand.text,
                  fontWeight: 800,
                  padding: '8px 12px',
                }}
              >
                통합 조회 · 비교 · 예약 · 커뮤니티
              </Badge>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center" style={{ marginBottom: 28 }}>
          <Col lg="10">
            <Row className="g-3">
              <Col md="4">
                <FeatureCard
                  icon="🔎"
                  title="매물 검색"
                  desc="키워드/조건 기반으로 원하는 코리빙 하우스를 빠르게 찾습니다."
                />
              </Col>
              <Col md="4">
                <FeatureCard
                  icon="🧾"
                  title="매물 비교"
                  desc="여러 매물을 한 화면에서 비교해 의사결정을 돕습니다."
                />
              </Col>
              <Col md="4">
                <FeatureCard
                  icon="🗺️"
                  title="지도 기반 조회"
                  desc="지도에서 위치를 확인하며 주변 매물을 직관적으로 탐색합니다."
                />
              </Col>
              <Col md="4">
                <FeatureCard
                  icon="🧑‍💼"
                  title="투어/입주 신청"
                  desc="관심 매물에 대해 투어 신청 및 입주 절차를 연결합니다."
                />
              </Col>
              <Col md="4">
                <FeatureCard
                  icon="🏢"
                  title="공용시설 예약"
                  desc="공용공간/시설의 예약 신청·변경·취소 흐름을 제공합니다."
                />
              </Col>
              <Col md="4">
                <FeatureCard
                  icon="💬"
                  title="커뮤니티(게시판)"
                  desc="공지/이벤트/정책/정보/QnA 등으로 정보 공유와 소통을 강화합니다."
                />
              </Col>
            </Row>
          </Col>
        </Row>

        {/* SECTION: 차별화 */}
        <Row className="justify-content-center">
          <Col lg="10">
            <Card className="shadow-sm border-0">
              <CardBody style={{ padding: 22 }}>
                <h2
                  id="about-diff"
                  style={{
                    margin: 0,
                    marginBottom: 10,
                    fontWeight: 900,
                    color: brand.text,
                  }}
                >
                  우리집의 차별화
                </h2>
                <Row className="g-3" style={{ marginTop: 2 }}>
                  <Col md="6">
                    <div
                      style={{
                        border: `1px solid ${brand.line}`,
                        borderRadius: 16,
                        padding: 16,
                        height: '100%',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          marginBottom: 8,
                          color: brand.text,
                        }}
                      >
                        ✅ 코리빙 정보 통합 조회
                      </div>
                      <div style={{ color: brand.sub, lineHeight: 1.7 }}>
                        여러 플랫폼/운영 정보를 한곳에 모아 탐색 비용을
                        줄입니다.
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div
                      style={{
                        border: `1px solid ${brand.line}`,
                        borderRadius: 16,
                        padding: 16,
                        height: '100%',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          marginBottom: 8,
                          color: brand.text,
                        }}
                      >
                        ✅ “비교” 중심 UX
                      </div>
                      <div style={{ color: brand.sub, lineHeight: 1.7 }}>
                        매물 간 비교 분석이 어려운 기존 단점을 UX로 해결합니다.
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div
                      style={{
                        border: `1px solid ${brand.line}`,
                        borderRadius: 16,
                        padding: 16,
                        height: '100%',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          marginBottom: 8,
                          color: brand.text,
                        }}
                      >
                        ✅ 예약/신청까지 한 흐름
                      </div>
                      <div style={{ color: brand.sub, lineHeight: 1.7 }}>
                        탐색 → 신청(투어/입주) → 공용시설 예약까지 단일 동선으로
                        연결합니다.
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div
                      style={{
                        border: `1px solid ${brand.line}`,
                        borderRadius: 16,
                        padding: 16,
                        height: '100%',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          marginBottom: 8,
                          color: brand.text,
                        }}
                      >
                        ✅ 커뮤니티로 체류시간 강화
                      </div>
                      <div style={{ color: brand.sub, lineHeight: 1.7 }}>
                        게시판 중심의 정보 제공/소통으로 방문 빈도와 만족도를
                        높입니다.
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
