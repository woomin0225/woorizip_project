// import React, { useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { Container, Row, Col, Card, CardBody, CardHeader } from 'reactstrap';
// import DemoNavbar from '../components/Navbars/DemoNavbar.js';
// import SimpleFooter from '../components/Footers/SimpleFooter.js';

// export default function Main() {
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   return (
//     <>
//       <style>{`
//     .quick-links-container {
//         margin-top: -30px;
//         position: relative;
//         z-index: 10;
//     }
//     @media (max-width: 768px) {
//         .quick-links-container {
//         margin-top: 20px; /* 모바일에서는 배너 아래로 분리 */
//         }
//     }
//     .placeholder-box {
//         border: 2px dashed #90cdf4;
//         background-color: rgba(255, 255, 255, 0.1);
//         border-radius: 8px;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         color: white;
//         font-weight: bold;
//     }
    
//     /* 아이콘 관련 스타일 */
//     .quick-links-wrapper {
//         max-width: 450px;
//         margin: 0 auto;   /* 가운데 정렬 */
//     }
//     .quick-icon {
//         width: 36px !important;
//         height: 36px !important;
//         font-size: 1rem !important;
//         margin-bottom: 4px;
//     }
//     /* 아이콘 아래 글자 크기 축소 */
//     .quick-title {
//         font-size: 0.75rem;
//         font-weight: bold;
//         color: #525f7f;
//     }
//     /* 아이콘 사이 간격 좁히기 */
//     .quick-col {
//         padding-left: 10px;
//         padding-right: 10px;
//     }
//     `}</style>

//       <DemoNavbar />
//       <main>
//         {/* 1. 슬라이드 배너 영역 (하늘색 테마 배경 + 임시 윤곽선) */}
//         <section
//           className="section-profile-cover section-shaped my-0"
//           style={{ height: '450px' }}
//         >
//           <div className="shape shape-style-1 bg-gradient-info">
//             <span />
//             <span />
//             <span />
//             <span />
//             <span />
//             <span />
//             <span />
//             <span />
//           </div>
//           <Container className="d-flex align-items-center h-100 py-lg">
//             <div className="w-100 h-75 placeholder-box flex-column text-center p-4">
//               <h2 className="text-white mb-2">슬라이드 배너 영역</h2>
//               <p className="text-white-50">
//                 나중에 이곳에 메인 배너 이미지나 캐러셀이 들어갑니다.
//               </p>
//             </div>
//           </Container>
//         </section>

//         {/* 2. 퀵 링크 (바로가기 아이콘) 영역 */}
//         <Container className="quick-links-container">
//           <div className="quick-links-wrapper">
//             <Card className="shadow-lg border-0">
//               <CardBody className="py-3 px-2">
//                 {' '}
//                 <Row className="text-center justify-content-center m-0">
//                   <Col xs="auto" className="quick-col">
//                     <div className="icon icon-shape bg-info text-white rounded-circle shadow quick-icon mx-auto">
//                       <i className="ni ni-building" />
//                     </div>
//                     <h6 className="mb-0 quick-title">방찾기</h6>
//                   </Col>
//                   <Col xs="auto" className="quick-col">
//                     <div className="icon icon-shape bg-success text-white rounded-circle shadow quick-icon mx-auto">
//                       <i className="ni ni-notification-70" />
//                     </div>
//                     <h6 className="mb-0 quick-title">공지사항</h6>
//                   </Col>
//                   <Col xs="auto" className="quick-col">
//                     <div className="icon icon-shape bg-warning text-white rounded-circle shadow quick-icon mx-auto">
//                       <i className="ni ni-calendar-grid-58" />
//                     </div>
//                     <h6 className="mb-0 quick-title">이벤트</h6>
//                   </Col>
//                   <Col xs="auto" className="quick-col">
//                     <div className="icon icon-shape bg-danger text-white rounded-circle shadow quick-icon mx-auto">
//                       <i className="ni ni-books" />
//                     </div>
//                     <h6 className="mb-0 quick-title">정책안내</h6>
//                   </Col>
//                   <Col xs="auto" className="quick-col">
//                     <div className="icon icon-shape bg-primary text-white rounded-circle shadow quick-icon mx-auto">
//                       <i className="ni ni-chat-round" />
//                     </div>
//                     <h6 className="mb-0 quick-title">커뮤니티</h6>
//                   </Col>
//                 </Row>
//               </CardBody>
//             </Card>
//           </div>
//         </Container>

//         {/* 3. 게시판 프리뷰 영역 */}
//         <section className="section bg-secondary mt-4">
//           <Container>
//             <Row>
//               <Col md="4" className="mb-4">
//                 <Card className="shadow border-0 h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h6 className="mb-0 text-info font-weight-bold">
//                       공지사항 (인기글)
//                     </h6>
//                   </CardHeader>
//                   <CardBody>
//                     <ul className="list-unstyled mb-0">
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - [안내] 우리집 서비스 정기 점검
//                         </Link>
//                       </li>
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 신규 코리빙 지점 오픈 안내
//                         </Link>
//                       </li>
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 플랫폼 이용 가이드라인 개정
//                         </Link>
//                       </li>
//                       <li className="text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 2026년 상반기 입주자 모집 완료
//                         </Link>
//                       </li>
//                     </ul>
//                   </CardBody>
//                 </Card>
//               </Col>

//               <Col md="4" className="mb-4">
//                 <Card className="shadow border-0 h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h6 className="mb-0 text-info font-weight-bold">
//                       진행중인 이벤트
//                     </h6>
//                   </CardHeader>
//                   <CardBody>
//                     <ul className="list-unstyled mb-0">
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - [이벤트] 친구 추천하고 월세 할인받자!
//                         </Link>
//                       </li>
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 웰컴 키트 증정 리뷰 이벤트
//                         </Link>
//                       </li>
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 루프탑 바베큐 파티 참여자 모집
//                         </Link>
//                       </li>
//                       <li className="text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 우수 입주자 선정 발표 (5월)
//                         </Link>
//                       </li>
//                     </ul>
//                   </CardBody>
//                 </Card>
//               </Col>

//               <Col md="4" className="mb-4">
//                 <Card className="shadow border-0 h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h6 className="mb-0 text-info font-weight-bold">
//                       정책 및 정보 제공
//                     </h6>
//                   </CardHeader>
//                   <CardBody>
//                     <ul className="list-unstyled mb-0">
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 청년 전세자금 대출 완벽 가이드
//                         </Link>
//                       </li>
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 2026년 주거 지원금 신청 방법
//                         </Link>
//                       </li>
//                       <li className="mb-2 text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 임대차 계약 시 주의해야 할 3가지
//                         </Link>
//                       </li>
//                       <li className="text-sm text-truncate">
//                         <Link to="#pablo" className="text-muted">
//                           - 전입신고 및 확정일자 받는 법
//                         </Link>
//                       </li>
//                     </ul>
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>
//           </Container>
//         </section>
//       </main>
//       <SimpleFooter />
//     </>
//   );
// }
