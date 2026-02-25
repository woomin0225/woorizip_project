// src/app/router/routes.jsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';
import { ROLES } from '../../shared/constants/roles';
import { ROUTES } from '../../shared/constants/routes';
import Login from '../../features/auth/pages/Login';
import Signup from '../../features/member/pages/Signup';
import Home from '../../shared/pages/Home';

import EventList from '../../features/board/pages/event/eventList';

import NoticeList from '../../features/notice/pages/NoticeList';
import NoticeDetail from '../../features/notice/pages/NoticeDetail';
import NoticeWrite from '../../features/notice/pages/NoticeWrite';
import NoticeUpdate from '../../features/notice/pages/NoticeUpdate';

import BoardList from '../../features/board/pages/BoardList';
import BoardWrite from '../../features/board/pages/BoardWrite';
import BoardDetail from '../../features/board/pages/BoardDetail';
import BoardUpdate from '../../features/board/pages/BoardUpdate';

import MemberList from '../../features/member/pages/MemberList';
import MemberInfo from '../../features/member/pages/MemberInfo';

import FacilityCategoryList from '../../features/facility/pages/category/FacilityCategoryList';
import FacilityCategoryForm from './../../features/facility/pages/category/FacilityCategoryForm';

import FacilityView from './../../features/facility/pages/facility/FacilityView';
import FacilityForm from './../../features/facility/pages/facility/FacilityForm';

import ReservationView from './../../features/facility/pages/reservation/ReservationView';
import ReservationForm from './../../features/facility/pages/reservation/ReservationForm';

import { Routes } from 'react-router-dom';

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

      // { path: '/boards', element: <BoardList /> },
      // { path: '/boards/:boardNum', element: <BoardDetail /> },
      
      { path: '/rooms', element: <Search /> },  // 방 찾기 페이지
      { path: '/rooms/:roomNo', element: <Detail /> },  // 방 상세보기 페이지

      // 로그인 필요
      {
        element: <RequireAuth />,
        children: [
          { path: '/boards/new', element: <BoardWrite /> },
          { path: '/boards/:boardNum/edit', element: <BoardUpdate /> },
          { path: ROUTES.MEMBER.MYPAGE, element: <MemberInfo /> },
          // { path: '/boards/new', element: <BoardWrite /> },
          // { path: '/boards/:boardNum/edit', element: <BoardUpdate /> },
          // { path: ROUTES.MEMBER.MYPAGE, element: <MemberInfo /> },
          {
            path: ROUTES.USER.FACILITY,
            element: <FacilityView />
          },
          {
            path: ROUTES.USER.FACILITY_FORM,
            element: <FacilityForm />
          },
          {
            path: ROUTES.USER.RESERVATION,
            element: <ReservationView />
          },
          {
            path: ROUTES.USER.RESERVATION_FORM,
            element: <ReservationForm />
          },

          { path: '/rooms/:roomNo/reviews/new', element: <ReviewCreate /> },  // 리뷰 등록 페이지
          { path: '/rooms/:roomNo/reviews/:reviewNo/edit', element: <ReviewModify /> }, // 리뷰 수정 페이지
        ],
      },

      // 관리자만
      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [
          // { path: ROUTES.ADMIN.MEMBERS, element: <MemberList /> },
          // { path: '/notices/new', element: <NoticeWrite /> },
          // { path: '/notices/:noticeNo/edit', element: <NoticeUpdate /> },

          {
            path: ROUTES.ADMIN.CATEGORY,
            element: <FacilityCategoryList />
          },
          {
            path: ROUTES.ADMIN.CATEGORY_FORM,
            element: <FacilityCategoryForm />,
          }
        ]
      },
    ],
  },
]);
