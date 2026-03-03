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
const BANNER_SLIDES = [1, 2, 3, 4, 5, 6];

export default function Home() {
  const [topNotices, setTopNotices] = useState([]);
  const [topInformations, setTopInformations] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);

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

  useEffect(() => {
    if (BANNER_SLIDES.length <= 1) return undefined;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goNextBanner = () =>
    setBannerIndex((prev) => (prev + 1) % BANNER_SLIDES.length);

  const goPrevBanner = () =>
    setBannerIndex(
      (prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length
    );

  return (
    <>
      <main>
        {/* 1. 슬라이드 배너 영역 */}
        <section
          className="section-profile-cover section-shaped my-0"
          style={{ height: '500px', overflow: 'hidden' }}
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
            <div className={`w-100 ${styles.bannerFrame}`}>
              <div className={styles.numberSlide}>
                {BANNER_SLIDES[bannerIndex]}
              </div>
              {BANNER_SLIDES.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.bannerNav} ${styles.prev}`}
                    onClick={goPrevBanner}
                    aria-label="이전 배너"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${styles.bannerNav} ${styles.next}`}
                    onClick={goNextBanner}
                    aria-label="다음 배너"
                  >
                    ›
                  </button>
                  <div className={styles.bannerDots}>
                    {BANNER_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.dot} ${
                          idx === bannerIndex ? styles.activeDot : ''
                        }`}
                        onClick={() => setBannerIndex(idx)}
                        aria-label={`${idx + 1}번 배너`}
                      />
                    ))}
                  </div>
                </>
              )}
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
