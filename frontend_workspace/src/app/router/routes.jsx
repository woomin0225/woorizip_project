// src/app/router/routes.jsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';
import { ROLES } from '../../shared/constants/roles';
import { ROUTES } from '../../shared/constants/routes';
import Login from '../../features/member/pages/Login';
import Signup from '../../features/member/pages/Signup';
import Home from '../../shared/pages/Home';

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
// import MemberInfo from '../../features/member/pages/MemberInfo';

import FacilityCategoryList from '../../features/facility/pages/category/FacilityCategoryList';
import FacilityCategoryForm from './../../features/facility/pages/category/FacilityCategoryForm';

import FacilityView from './../../features/facility/pages/facility/FacilityView';
import FacilityForm from './../../features/facility/pages/facility/FacilityForm';

import ReservationView from './../../features/facility/pages/reservation/ReservationView';
import ReservationForm from './../../features/facility/pages/reservation/ReservationForm';

import Search from '../../features/houseAndRoom/pages/Search';
import Detail from './../../features/houseAndRoom/pages/Detail';
import ReviewCreate from './../../features/houseAndRoom/pages/ReviewCreate';
import ReviewModify from './../../features/houseAndRoom/pages/ReviewModify';
import Management from "../../features/houseAndRoom/pages/Management";
import HouseRegistration from "../../features/houseAndRoom/pages/house/HouseRegistration";
import HouseSelection from "../../features/houseAndRoom/pages/house/HouseSelection";
import RoomRegistration from "../../features/houseAndRoom/pages/room/RoomRegistration";
import EstateModify from '../../features/houseAndRoom/pages/EstateModify';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // 메인 홈
      { path: '/', element: <Home /> },

      { path: ROUTES.AUTH.LOGIN, element: <Login /> },
      { path: ROUTES.AUTH.SIGNUP, element: <Signup /> },

      { path: '/notices', element: <NoticeList /> },
      { path: '/notices/:noticeNo', element: <NoticeDetail /> },

      { path: '/qna', element: <QnaList /> },
      { path: '/qna/:postNo', element: <QnaDetail /> },

      { path: '/information', element: <InformationList /> },
      { path: '/information/:postNo', element: <InformationDetail /> },

      { path: '/event', element: <EventList /> },
      { path: '/event/:postNo', element: <EventDetail /> },

      { path: '/rooms', element: <Search /> }, // 방 찾기 페이지
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
            path: ROUTES.USER.FACILITY,
            element: <FacilityView />,
          },
          {
            path: ROUTES.USER.FACILITY_FORM,
            element: <FacilityForm />,
          },
          {
            path: ROUTES.USER.RESERVATION,
            element: <ReservationView />,
          },
          {
            path: ROUTES.USER.RESERVATION_FORM,
            element: <ReservationForm />,
          },

          { path: '/rooms/:roomNo/reviews/new', element: <ReviewCreate /> },  // 리뷰 등록 페이지
          { path: '/rooms/:roomNo/reviews/:reviewNo/edit', element: <ReviewModify /> }, // 리뷰 수정 페이지
          { path: "/estate/manage", element: <Management /> },
          { path: "/estate/modify", element: <EstateModify/> },
          { path: "/estate/houses/new", element: <HouseRegistration /> },
          { path: "/estate/houses/select", element: <HouseSelection /> },
          { path: "/estate/houses/:houseNo/rooms/new", element: <RoomRegistration /> },
        ],
      },

      // 관리자만
      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [
          // { path: ROUTES.ADMIN.MEMBERS, element: <MemberList /> },
          { path: '/notices/new', element: <NoticeWrite /> },
          { path: '/notices/:noticeNo/edit', element: <NoticeUpdate /> },

          { path: '/information/new', element: <InformationWrite /> },
          { path: '/information/:postNo/edit', element: <InformationUpdate /> },

          { path: '/event/new', element: <EventWrite /> },
          { path: '/event/:postNo/edit', element: <EventUpdate /> },

          {
            path: ROUTES.ADMIN.CATEGORY,
            element: <FacilityCategoryList />,
          },
          {
            path: ROUTES.ADMIN.CATEGORY_FORM,
            element: <FacilityCategoryForm />,
          },
        ],
      },
    ],
  },
]);
