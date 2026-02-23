// src/app/router/routes.jsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';
import { ROLES } from '../../shared/constants/roles';

import Login from '../../features/auth/pages/Login';
import Signup from '../../features/member/pages/Signup';
import Home from '../../shared/pages/Home';

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

      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },

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
          { path: '/mypage', element: <MemberInfo /> },

          { path: '/lessor/facilities/list/:houseNo', element: <LessorFacilityList /> },
          { path: '/lessor/facilities/new/:houseNo', element: <LessorFacilityCreate /> },
          { path: '/lessor/facilities/detail/:facilityNo', element: <LessorFacilityDetail /> },
          { path: '/lessor/facilities/edit/:facilityNo', element: <LessorFacilityModify /> },
          
          { path: '/lessor/reservation/list/:houseNo/:facilityNo', element: <LessorReservationList /> },
          { path: '/lessor/reservation/detail/:reservationNo', element: <LessorReservationDetail /> },
          
          { path: '/user/facilities/list/:houseNo', element: <UserFaciliityList /> },
          { path: '/user/facilities/detail/:facilityNo', element: <UserFacilityDetail /> },
          
          { path: '/user/reservation/new/:facilityNo', element: <UserReservationCreate /> },
          { path: '/user/reservation/detail/:reservationNo', element: <UserReservationDetail /> },
          { path: '/user/reservation/list/:houseNo', element: <UserReservationList /> },
          { path: '/user/reservation/edit/:reservationNo', element: <UserReservationModify /> }
        ],
      },

      // 관리자만
      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [
          { path: '/admin/members', element: <MemberList /> },
          { path: '/notices/new', element: <NoticeWrite /> },
          { path: '/notices/:noticeNo/edit', element: <NoticeUpdate /> },

          { path: '/admin/categories/new', element: <AdminFacilityCategoryCreate /> },
          { path: '/admin/categories', element: <AdminFacilityCategoryList /> },
          { path: '/admin/categories/edit/:facilityCode', element: <AdminFacilityCategoryModify /> },

          { path: '/admin/facilities/detail/:facilityNo', element: <AdminFacilityDetail /> },
          { path: '/admin/facilities/list/:houseNo', element: <AdminFacilityList /> },
          { path: '/admin/facilities/edit/:facilityNo', element: <AdminFacilityModify /> },

          { path: '/admin/reservation/detail/:reservationNo', element: <AdminReservationDetail /> },
          { path: '/admin/reservation/list/:houseNo', element: <AdminReservationList /> },
          { path: '/admin/reservation/edit/:reservationNo', element: <AdminReservationModify /> }
        ],
      },
    ],
  },
]);
