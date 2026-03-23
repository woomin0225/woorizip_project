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

import banner1 from '../../assets/images/banner/banner1.png';
import banner2 from '../../assets/images/banner/banner2.png';
import banner3 from '../../assets/images/banner/banner3.png';
import banner4 from '../../assets/images/banner/banner4.png';
import banner5 from '../../assets/images/banner/banner5.png';
import banner6 from '../../assets/images/banner/banner6.png';

const BANNER_SLIDES = [
  { id: 1, image: banner1, alt: '배너 1' },
  { id: 2, image: banner2, alt: '배너 2' },
  { id: 3, image: banner3, alt: '배너 3' },
  { id: 4, image: banner4, alt: '배너 4' },
  { id: 5, image: banner5, alt: '배너 5' },
  { id: 6, image: banner6, alt: '배너 6' },
];

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

  const currentBanner = BANNER_SLIDES[bannerIndex];

  return (
    <>
      <main>
        <section
          className={`section-profile-cover section-shaped my-0 ${styles.heroSection}`}
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
              <img
                src={currentBanner.image}
                alt={currentBanner.alt}
                className={styles.bannerImage}
              />

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
                    {BANNER_SLIDES.map((slide, idx) => (
                      <button
                        key={slide.id}
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

        <section className="section bg-secondary mt-4">
          <Container>
            <Row>
              <Col md="4" className="mb-4">
                <Card className={`shadow border-0 h-100 ${styles.boardCard}`}>
                  <CardHeader className={styles.boardCardHeader}>
                    <h6 className={styles.noticeTitle}>공지사항 (인기글)</h6>
                  </CardHeader>
                  <CardBody>
                    <ul className={styles.boardList}>
                      {topNotices.map((notice) => (
                        <li key={notice.postNo} className={styles.boardItem}>
                          <Link
                            to={`/notices/${notice.postNo}`}
                            className={styles.boardLink}
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
                <Card className={`shadow border-0 h-100 ${styles.boardCard}`}>
                  <CardHeader className={styles.boardCardHeader}>
                    <h6 className={styles.eventTitle}>진행중인 이벤트</h6>
                  </CardHeader>
                  <CardBody>
                    <ul className={styles.boardList}>
                      {topEvents.map((event) => (
                        <li key={event.postNo} className={styles.boardItem}>
                          <Link
                            to={`/event/${event.postNo}`}
                            className={styles.boardLink}
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
                <Card className={`shadow border-0 h-100 ${styles.boardCard}`}>
                  <CardHeader className={styles.boardCardHeader}>
                    <h6 className={styles.infoTitle}>정책 및 정보 제공</h6>
                  </CardHeader>
                  <CardBody>
                    <ul className={styles.boardList}>
                      {topInformations.map((info) => (
                        <li key={info.postNo} className={styles.boardItem}>
                          <Link
                            to={`/information/${info.postNo}`}
                            className={styles.boardLink}
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
