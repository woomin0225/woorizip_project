// src/app/router/guards/RequireRole.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';

export default function RequireRole({ allowedRoles = [], redirectTo = '/' }) {
  const { role } = useAuth();

  if (!role || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}
