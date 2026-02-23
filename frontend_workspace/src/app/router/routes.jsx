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
        ],
      },

      // 관리자만
      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [
          { path: '/admin/members', element: <MemberList /> },
          { path: '/notices/new', element: <NoticeWrite /> },
          { path: '/notices/:noticeNo/edit', element: <NoticeUpdate /> },
        ],
      },
    ],
  },
]);
