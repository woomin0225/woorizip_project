import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, CardHeader } from 'reactstrap';
import ViewsRankingFrame from '../../features/houseAndRoom/components/ranking/ViewsRankingFrame';
import styles from './Home.module.css';
import ReviewRankingFrame from '../../features/houseAndRoom/components/ranking/ReviewRankingFrame';
import WishRankingFrame from '../../features/houseAndRoom/components/ranking/WishRankingFrame';

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <style>{`
    .placeholder-box {
        border: 2px dashed #90cdf4;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
    }
    `}</style>

      <main>
        {/* 1. 슬라이드 배너 영역 (하늘색 테마 배경 + 임시 윤곽선) */}
        <section
          className="section-profile-cover section-shaped my-0"
          style={{ height: '500px' }}
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
          <Container className="d-flex align-items-center h-100 py-lg">
            <div className={`w-100 h-75 ${styles.placeholderBox} flex-column text-center p-4`}>
              <h2 className="text-white mb-2">슬라이드 배너 영역</h2>
              <p className="text-white-50">
                나중에 이곳에 메인 배너 이미지나 캐러셀이 들어갑니다.
              </p>
            </div>
          </Container>
        </section>


        {/* 조회순 기반 매물 랭킹 */}
        <section className="section pt-4">
          <Container>
            <Row>
              <Col md="6" className="mb-4">
                <ViewsRankingFrame
                  type="room"
                  period={1}
                  rankingTitle="일간 방 조회랭킹"
                  limit={10}
                />
              </Col>
              <Col md="6" className="mb-4">
                <ViewsRankingFrame
                  type="room"
                  period={30}
                  rankingTitle="월간 방 조회랭킹"
                  limit={10}
                />
              </Col>
              <Col md="6" className="mb-4">
                <ViewsRankingFrame
                  type="house"
                  period={1}
                  rankingTitle="일간 건물 조회랭킹"
                  limit={10}
                />
              </Col>
              <Col md="6" className="mb-4">
                <ViewsRankingFrame
                  type="house"
                  period={7}
                  rankingTitle="주간 건물 조회랭킹"
                  limit={10}
                />
              </Col>
            </Row>
          </Container>

          <Container>
            <Row>
              <Col md="6" className="mb-4">
                <ReviewRankingFrame
                  period={30}
                  rankingTitle="월간 리뷰평균 랭킹"
                  limit={10}
                />
              </Col>
              <Col md="6" className="mb-4">
                <WishRankingFrame
                  rankingTitle="관심목록 랭킹"
                  limit={10}
                  subTitle="Total Wish"
                />
              </Col>
            </Row>
          </Container>
        </section>
        

        {/* 3. 게시판 프리뷰 영역 */}
        <section className="section bg-secondary mt-4">
          <Container>
            <Row>
              <Col md="4" className="mb-4">
                <Card className="shadow border-0 h-100">
                  <CardHeader className="bg-white border-0 pb-0">
                    <h6 className="mb-0 text-info font-weight-bold">
                      공지사항 (인기글)
                    </h6>
                  </CardHeader>
                  <CardBody>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - [안내] 우리집 서비스 정기 점검
                        </Link>
                      </li>
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 신규 코리빙 지점 오픈 안내
                        </Link>
                      </li>
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 플랫폼 이용 가이드라인 개정
                        </Link>
                      </li>
                      <li className="text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 2026년 상반기 입주자 모집 완료
                        </Link>
                      </li>
                    </ul>
                  </CardBody>
                </Card>
              </Col>

              <Col md="4" className="mb-4">
                <Card className="shadow border-0 h-100">
                  <CardHeader className="bg-white border-0 pb-0">
                    <h6 className="mb-0 text-info font-weight-bold">
                      진행중인 이벤트
                    </h6>
                  </CardHeader>
                  <CardBody>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - [이벤트] 친구 추천하고 월세 할인받자!
                        </Link>
                      </li>
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 웰컴 키트 증정 리뷰 이벤트
                        </Link>
                      </li>
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 루프탑 바베큐 파티 참여자 모집
                        </Link>
                      </li>
                      <li className="text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 우수 입주자 선정 발표 (5월)
                        </Link>
                      </li>
                    </ul>
                  </CardBody>
                </Card>
              </Col>

              <Col md="4" className="mb-4">
                <Card className="shadow border-0 h-100">
                  <CardHeader className="bg-white border-0 pb-0">
                    <h6 className="mb-0 text-info font-weight-bold">
                      정책 및 정보 제공
                    </h6>
                  </CardHeader>
                  <CardBody>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 청년 전세자금 대출 완벽 가이드
                        </Link>
                      </li>
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 2026년 주거 지원금 신청 방법
                        </Link>
                      </li>
                      <li className="mb-2 text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 임대차 계약 시 주의해야 할 3가지
                        </Link>
                      </li>
                      <li className="text-sm text-truncate">
                        <Link to="#pablo" className="text-muted">
                          - 전입신고 및 확정일자 받는 법
                        </Link>
                      </li>
                    </ul>
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
