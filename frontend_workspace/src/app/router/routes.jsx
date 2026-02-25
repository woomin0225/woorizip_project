import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';
import { ROLES } from '../../shared/constants/roles';
import { ROUTES } from '../../shared/constants/routes';

import Home from '../../shared/pages/Home';
import Login from '../../features/member/pages/Login';
import Signup from '../../features/member/pages/Signup';
import MemberList from '../../features/member/pages/MemberList';

import MyInfo from '../../features/user/pages/MyInfo';
import MyInfoModify from '../../features/user/pages/MyInfoModify';
import Withdrawn from '../../features/user/pages/withdrawn';

import WishlistPage from '../../features/wishlist/pages/WishlistPage';
import TourApply from '../../features/tour/pages/TourApply';
import OccupyApply from '../../features/tour/pages/OccupyApply';
import ContractCreate from '../../features/contract/pages/ContractCreate';
import Statement from '../../features/contract/pages/Statement';
import Completion from '../../features/contract/pages/Completion';

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Home /> },

      { path: ROUTES.AUTH.LOGIN, element: <Login /> },
      { path: ROUTES.AUTH.SIGNUP, element: <Signup /> },

      {
        element: <RequireAuth />,
        children: [
          { path: ROUTES.MEMBER.MYPAGE, element: <WishlistPage /> },
          { path: ROUTES.MEMBER.MY_INFO, element: <MyInfo /> },
          { path: ROUTES.MEMBER.MY_INFO_EDIT, element: <MyInfoModify /> },
          { path: ROUTES.MEMBER.MY_WITHDRAW, element: <Withdrawn /> },

          { path: ROUTES.WISHLIST.LIST, element: <WishlistPage /> },

          { path: ROUTES.TOUR.APPLY, element: <TourApply /> },
          { path: ROUTES.TOUR.LIST, element: <OccupyApply /> },
          { path: '/mypage/tour', element: <OccupyApply /> },

          { path: ROUTES.CONTRACT.APPLY, element: <ContractCreate /> },
          { path: ROUTES.CONTRACT.LIST, element: <Statement /> },
          { path: ROUTES.CONTRACT.COMPLETION, element: <Completion /> },
          { path: '/mypage/contracts', element: <Statement /> },
        ],
      },

      {
        element: <RequireRole allowedRoles={[ROLES.ADMIN]} />,
        children: [{ path: ROUTES.ADMIN.MEMBERS, element: <MemberList /> }],
      },
    ],
  },
]);


