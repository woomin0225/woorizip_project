import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';
import { ROLES } from '../../shared/constants/roles';
import { ROUTES } from '../../shared/constants/routes';

import Home from '../../shared/pages/Home';
import About from '../../shared/pages/About';
import Login from '../../features/member/pages/Login';
import Signup from '../../features/member/pages/Signup';
import FindId from '../../features/member/pages/FindId';
import FindPassword from '../../features/member/pages/FindPassword';
import OAuth2RedirectHandler from '../../features/member/pages/OAuth2RedirectHandler';

import NoticeList from '../../features/board/pages/notice/NoticeList';
import NoticeDetail from '../../features/board/pages/notice/NoticeDetail';
import NoticeWrite from '../../features/board/pages/notice/NoticeWrite';
import NoticeUpdate from '../../features/board/pages/notice/NoticeUpdate';

import EventList from '../../features/board/pages/event/EventList';
import EventDetail from '../../features/board/pages/event/EventDetail';
import EventWrite from '../../features/board/pages/event/EventWrite';
import EventUpdate from '../../features/board/pages/event/EventUpdate';

import QnaList from '../../features/board/pages/qna/QnaList';
import QnaDetail from '../../features/board/pages/qna/QnaDetail';
import QnaWrite from '../../features/board/pages/qna/QnaWrite';
import QnaUpdate from '../../features/board/pages/qna/QnaUpdate';

import InformationList from '../../features/board/pages/information/InformationList';
import InformationDetail from '../../features/board/pages/information/InformationDetail';
import InformationWrite from '../../features/board/pages/information/InformationWrite';
import InformationUpdate from '../../features/board/pages/information/InformationUpdate';

import MemberList from '../../features/member/pages/MemberList';

import MyInfo from '../../features/user/pages/MyInfo';
import MyInfoModify from '../../features/user/pages/MyInfoModify';
import Withdraw from '../../features/user/pages/withdraw';
import MyPageHome from '../../features/user/pages/MyPageHome';

import WishlistPage from '../../features/wishlist/pages/WishlistPage';
import TourApply from '../../features/tour/pages/TourApply';
import OccupyApply from '../../features/tour/pages/OccupyApply';
import ApplicationDetail from '../../features/tour/pages/ApplicationDetail';
import ContractCreate from '../../features/contract/pages/ContractCreate';
import Statement from '../../features/contract/pages/Statement';
import Completion from '../../features/contract/pages/Completion';
import PaymentSuccess from '../../features/contract/pages/PaymentSuccess';
import PaymentFail from '../../features/contract/pages/PaymentFail';

import Search from '../../features/houseAndRoom/pages/Search';
import Detail from './../../features/houseAndRoom/pages/Detail';
import ReviewCreate from './../../features/houseAndRoom/pages/ReviewCreate';
import ReviewModify from './../../features/houseAndRoom/pages/ReviewModify';
import Management from '../../features/houseAndRoom/pages/Management';
import HouseRegistration from '../../features/houseAndRoom/pages/house/HouseRegistration';
import HouseSelection from '../../features/houseAndRoom/pages/house/HouseSelection';
import RoomRegistration from '../../features/houseAndRoom/pages/room/RoomRegistration';
import EstateModify from '../../features/houseAndRoom/pages/EstateModify';
import Delete from '../../features/houseAndRoom/pages/Delete';

import FacilityViewPage from './../../features/facility/pages/facility/FacilityView';
import FacilityFormPage from './../../features/facility/pages/facility/FacilityForm';
import FacilityCategoryFormPage from './../../features/facility/pages/category/FacilityCategoryForm';
import FacilityCategoryListPage from './../../features/facility/pages/category/FacilityCategoryList';
import ReservationViewPage from './../../features/facility/pages/reservation/ReservationView';
import ReservationFormPage from './../../features/facility/pages/reservation/ReservationForm';

import Empty from '../../shared/pages/Empty';
import RouteError from './../../shared/pages/RouteError';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    // errorElement: <Empty />,
    errorElement: <RouteError />, // 에러확인용 임시
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },

      { path: ROUTES.AUTH.LOGIN, element: <Login /> },
      { path: ROUTES.AUTH.SIGNUP, element: <Signup /> },
      { path: '/find-id', element: <FindId /> },
      { path: '/find-password', element: <FindPassword /> },
      { path: '/oauth2/redirect', element: <OAuth2RedirectHandler /> },

      {
        element: <RequireAuth />,
        children: [
          { path: ROUTES.MEMBER.MYPAGE, element: <MyPageHome /> },
          { path: ROUTES.MEMBER.MY_INFO, element: <MyInfo /> },
          { path: ROUTES.MEMBER.MY_INFO_EDIT, element: <MyInfoModify /> },
          { path: ROUTES.MEMBER.MY_WITHDRAW, element: <Withdraw /> },

          { path: ROUTES.WISHLIST.LIST, element: <WishlistPage /> },

          { path: ROUTES.TOUR.APPLY, element: <TourApply /> },
          { path: ROUTES.TOUR.LIST, element: <OccupyApply /> },
          {
            path: '/mypage/applications/:kind/:id',
            element: <ApplicationDetail />,
          },
          { path: '/rooms/:roomNo/tour', element: <TourApply /> },
          { path: '/mypage/tour', element: <OccupyApply /> },

          { path: ROUTES.CONTRACT.APPLY, element: <ContractCreate /> },
          { path: '/rooms/:roomNo/contract', element: <ContractCreate /> },
          { path: ROUTES.CONTRACT.LIST, element: <Statement /> },
          { path: ROUTES.CONTRACT.COMPLETION, element: <Completion /> },
          { path: '/contract/payment/success', element: <PaymentSuccess /> },
          { path: '/contract/payment/fail', element: <PaymentFail /> },
          { path: '/mypage/contracts', element: <Statement /> },
        ],
      },
      { path: '/notices', element: <NoticeList /> },
      { path: '/notices/:postNo', element: <NoticeDetail /> },

      { path: '/qna', element: <QnaList /> },
      { path: '/qna/:postNo', element: <QnaDetail /> },

      { path: '/information', element: <InformationList /> },
      { path: '/information/:postNo', element: <InformationDetail /> },

      { path: '/event', element: <EventList /> },
      { path: '/event/:postNo', element: <EventDetail /> },

      { path: '/rooms', element: <Search /> }, // 방 찾기 페이지
      { path: '/houses/:houseNo', element: <Detail /> }, // 건물 상세보기 페이지
      { path: '/rooms/:roomNo', element: <Detail /> }, // 방 상세보기 페이지

      // 로그인 필요
      {
        element: <RequireAuth />,
        children: [
          // { path: ROUTES.MEMBER.MYPAGE, element: <MemberInfo /> },
          { path: '/qna/new', element: <QnaWrite /> },
          { path: '/qna/:postNo/edit', element: <QnaUpdate /> },
          // { path: ROUTES.MEMBER.MYPAGE, element: <MemberInfo /> },
          {
            path: ROUTES.USER.FACILITY_VIEW,
            element: <FacilityViewPage />,
          },
          {
            path: ROUTES.USER.FACILITY_FORM,
            element: <FacilityFormPage />,
          },
          {
            path: ROUTES.USER.RESERVATION_VIEW,
            element: <ReservationViewPage />,
          },
          {
            path: ROUTES.USER.RESERVATION_FORM,
            element: <ReservationFormPage />,
          },

          { path: '/rooms/:roomNo/reviews/new', element: <ReviewCreate /> }, // 리뷰 등록 페이지
          {
            path: '/rooms/:roomNo/reviews/:reviewNo/edit',
            element: <ReviewModify />,
          }, // 리뷰 수정 페이지
          { path: '/estate/manage', element: <Management /> },
          { path: '/estate/modify', element: <EstateModify /> },
          { path: '/estate/houses/new', element: <HouseRegistration /> },
          { path: '/estate/houses/select', element: <HouseSelection /> },
          {
            path: '/estate/houses/:houseNo/rooms/new',
            element: <RoomRegistration />,
          },
          { path: '/estate/delete', element: <Delete /> },
        ],
      },

      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        // children: [{ path: ROUTES.ADMIN.MEMBERS, element: <MemberList /> }],
        children: [
          // { path: ROUTES.ADMIN.MEMBERS, element: <MemberList /> },
          { path: '/notices/new', element: <NoticeWrite /> },
          { path: '/notices/:postNo/edit', element: <NoticeUpdate /> },

          { path: '/information/new', element: <InformationWrite /> },
          { path: '/information/:postNo/edit', element: <InformationUpdate /> },

          { path: '/event/new', element: <EventWrite /> },
          { path: '/event/:postNo/edit', element: <EventUpdate /> },

          {
            path: ROUTES.ADMIN.CATEGORY,
            element: <FacilityCategoryListPage />,
          },
          {
            path: ROUTES.ADMIN.CATEGORY_FORM,
            element: <FacilityCategoryFormPage />,
          },
        ],
      },
      {
        path: '*',
        element: <Empty />,
      },
    ],
  },
]);
