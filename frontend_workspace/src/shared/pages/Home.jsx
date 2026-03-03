import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, CardHeader } from 'reactstrap';
import ViewsRankingFrame from '../../features/houseAndRoom/components/ranking/ViewsRankingFrame';
import styles from './Home.module.css';
import ReviewRankingFrame from '../../features/houseAndRoom/components/ranking/ReviewRankingFrame';
import WishRankingFrame from '../../features/houseAndRoom/components/ranking/WishRankingFrame';
import { fetchNoticeTop5 } from '../../features/board/api/NoticeApi';
import { fetchInformationTop5 } from '../../features/board/api/InformationApi';
import { fetchEventTop5 } from '../../features/board/api/EventApi';

export default function Home() {
  const [topNotices, setTopNotices] = useState([]);
  const [topInformations, setTopInformations] = useState([]);
  const [topEvents, setTopEvents] = useState([]);

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchNoticeTop5()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : (res?.data?.data ?? res?.data?.content ?? []);
        setTopNotices(list);
      })
      .catch(console.error);
  }, [location.pathname]);

  useEffect(() => {
    fetchInformationTop5()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : (res?.data?.data ?? res?.data?.content ?? []);
        setTopInformations(list);
      })
      .catch(console.error);
  }, [location.pathname]);

  useEffect(() => {
    fetchEventTop5()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : (res?.data?.data ?? res?.data?.content ?? []);
        setTopEvents(list);
      })
      .catch(console.error);
  }, [location.pathname]);

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
            <div
              className={`w-100 h-75 ${styles.placeholderBox} flex-column text-center p-4`}
            >
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
                      {topNotices.map((notice) => (
                        <li
                          key={notice.postNo}
                          className="mb-2 text-sm text-truncate"
                        >
                          <Link
                            to={`/notices/${notice.postNo}`}
                            className="text-muted"
                          >
                            - {notice.postTitle}
                          </Link>
                        </li>
                      ))}
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
                      {topEvents.map((event) => (
                        <li
                          key={event.postNo}
                          className="mb-2 text-sm text-truncate"
                        >
                          <Link
                            to={`/event/${event.postNo}`}
                            className="text-muted"
                          >
                            - {event.postTitle}
                          </Link>
                        </li>
                      ))}
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
                      {topInformations.map((info) => (
                        <li
                          key={info.postNo}
                          className="mb-2 text-sm text-truncate"
                        >
                          <Link
                            to={`/information/${info.postNo}`}
                            className="text-muted"
                          >
                            - {info.postTitle}
                          </Link>
                        </li>
                      ))}
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
