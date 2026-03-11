import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { tokenStore } from '../../http/tokenStore';

export default function RequireAuth({ redirectTo = '/login' }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  // 로그인 직후 AuthProvider 상태 반영 전에도 저장된 토큰이 있으면 통과
  const hasStoredToken = Boolean(tokenStore.getAccess() || localStorage.getItem('accessToken'));

  if (!isAuthed && !hasStoredToken) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
