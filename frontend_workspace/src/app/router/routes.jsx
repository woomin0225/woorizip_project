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

import AdminFacilityCategoryCreate from './../../features/facility/pages/admin/category/AdminFacilityCategoryCreate';
import AdminFacilityCategoryList from './../../features/facility/pages/admin/category/AdminFacilityCategoryList';
import AdminFacilityCategoryModify from './../../features/facility/pages/admin/category/AdminFacilityCategoryModify';

import AdminFacilityDetail from './../../features/facility/pages/admin/facility/AdminFacilityDetail';
import AdminFacilityList from './../../features/facility/pages/admin/facility/AdminFacilityList';
import AdminFacilityModify from './../../features/facility/pages/admin/facility/AdminFacilityModify';

import AdminReservationDetail from './../../features/facility/pages/admin/reservation/AdminReservationDetail';
import AdminReservationList from './../../features/facility/pages/admin/reservation/AdminReservationList';
import AdminReservationModify from './../../features/facility/pages/admin/reservation/AdminReservationModify';

import LessorFacilityList from './../../features/facility/pages/lessor/facility/LessorFaciliityList';
import LessorFacilityCreate from './../../features/facility/pages/lessor/facility/LessorFacilityCreate';
import LessorFacilityDetail from './../../features/facility/pages/lessor/facility/LessorFacilityDetail';
import LessorFacilityModify from './../../features/facility/pages/lessor/facility/LessorFacilityModify';

import LessorReservationDetail from './../../features/facility/pages/lessor/reservation/LessorReservationDetail';
import LessorReservationList from './../../features/facility/pages/lessor/reservation/LessorReservationList';

import UserFaciliityList from './../../features/facility/pages/user/facility/UserFaciliityList';
import UserFacilityDetail from '../../features/facility/pages/user/facility/UserFacilityDetail';

import UserReservationCreate from './../../features/facility/pages/user/reservation/UserReservationCreate';
import UserReservationDetail from './../../features/facility/pages/user/reservation/UserReservationDetail';
import UserReservationList from './../../features/facility/pages/user/reservation/UserReservationList';
import UserReservationModify from './../../features/facility/pages/user/reservation/UserReservationModify';

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

      { path: '/boards', element: <BoardList /> },
      { path: '/boards/:boardNum', element: <BoardDetail /> },

      // 로그인 필요
      {
        element: <RequireAuth />,
        children: [
          { path: '/boards/new', element: <BoardWrite /> },
          { path: '/boards/:boardNum/edit', element: <BoardUpdate /> },
          { path: ROUTES.MEMBER.MYPAGE, element: <MemberInfo /> },

          {
            path: ROUTES.LESSOR.FACILITY,
            element: <LessorFacilityList />,
          },
          {
            path: ROUTES.LESSOR.FACILITY_CREATE,
            element: <LessorFacilityCreate />,
          },
          {
            path: ROUTES.LESSOR.FACILITY_DETAIL,
            element: <LessorFacilityDetail />,
          },
          {
            path: ROUTES.LESSOR.FACILITY_MODIFY,
            element: <LessorFacilityModify />,
          },

          {
            path: ROUTES.LESSOR.RESERVATION,
            element: <LessorReservationList />,
          },
          {
            path: ROUTES.LESSOR.RESERVATION_DETAIL,
            element: <LessorReservationDetail />,
          },

          {
            path: ROUTES.USER.FACILITY,
            element: <UserFaciliityList />,
          },
          {
            path: ROUTES.USER.FACILITY_DETAIL,
            element: <UserFacilityDetail />,
          },

          {
            path: ROUTES.USER.RESERVATION,
            element: <UserReservationList />,
          },
          {
            path: ROUTES.USER.RESERVATION_DETAIL,
            element: <UserReservationDetail />,
          },
          {
            path: ROUTES.USER.RESERVATION_CREATE,
            element: <UserReservationCreate />,
          },
          {
            path: ROUTES.USER.RESERVATION_MODIFY,
            element: <UserReservationModify />,
          },
        ],
      },

      // 관리자만
      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [
          { path: ROUTES.ADMIN.MEMBERS, element: <MemberList /> },
          { path: '/notices/new', element: <NoticeWrite /> },
          { path: '/notices/:noticeNo/edit', element: <NoticeUpdate /> },

          {
            path: ROUTES.ADMIN.CATEGORY,
            element: <AdminFacilityCategoryList /> },
          {
            path: ROUTES.ADMIN.CATEGOGY_CREATE,
            element: <AdminFacilityCategoryCreate />,
          },
          {
            path: ROUTES.ADMIN.CATEGORY_MODIFY,
            element: <AdminFacilityCategoryModify />,
          },

          {
            path: ROUTES.ADMIN.FACILITY,
            element: <AdminFacilityList />,
          },
          {
            path: ROUTES.ADMIN.FACILITY_DETAIL,
            element: <AdminFacilityDetail />,
          },
          {
            path: ROUTES.ADMIN.FACILITY_MODIFY,
            element: <AdminFacilityModify />,
          },

          {
            path: ROUTES.ADMIN.RESERVATION,
            element: <AdminReservationList />,
          },          
          {
            path: ROUTES.ADMIN.RESERVATION_DETAIL,
            element: <AdminReservationDetail />,
          },
          {
            path: ROUTES.ADMIN.RESERVATION_MODIFY,
            element: <AdminReservationModify />,
          },
        ],
      },
    ],
  },
]);
