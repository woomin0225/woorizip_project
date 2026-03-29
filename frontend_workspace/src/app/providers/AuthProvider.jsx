import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { tokenStore } from '../http/tokenStore';
import { subscribeAuthEvent, emitLogout } from '../http/authEvents';
import {
  extractRoleFromAccessToken,
  extractUserNoFromAccessToken,
} from './utils/jwt';
import { ROLES } from '../../shared/constants/roles';

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (!role) return null;
  if (role === 'admin' || role === 'ADMIN') return 'ROLE_ADMIN';
  if (role === 'user' || role === 'USER') return 'ROLE_USER';
  return role;
}

function computeRoleFromStores(accessToken) {
  const storedRole = normalizeRole(tokenStore.getRole?.());
  if (storedRole) return storedRole;

  const jwtRole = normalizeRole(extractRoleFromAccessToken(accessToken));
  return jwtRole || null;
}

function computeIsAdmin(role) {
  const normalizedRole = normalizeRole(role);
  return (
    normalizedRole === ROLES.ADMIN ||
    normalizedRole === 'ROLE_ADMIN' ||
    normalizedRole === 'ADMIN'
  );
}

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(tokenStore.getAccess());
  const [refreshToken, setRefreshToken] = useState(tokenStore.getRefresh());
  const [userId, setUserId] = useState(tokenStore.getUserId?.() || null);
  const [role, setRole] = useState(
    computeRoleFromStores(tokenStore.getAccess())
  );
  const [userNo, setUserNo] = useState(
    extractUserNoFromAccessToken(tokenStore.getAccess())
  );

  const isAuthed = Boolean(accessToken);
  const isAdmin = useMemo(() => computeIsAdmin(role), [role]);

  const syncFromTokenStore = useCallback(() => {
    const nextAccess = tokenStore.getAccess();
    setAccessToken(nextAccess);
    setRefreshToken(tokenStore.getRefresh());
    setUserId(tokenStore.getUserId?.() || null);
    setUserNo(extractUserNoFromAccessToken(nextAccess));
    setRole(computeRoleFromStores(nextAccess));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuthEvent(syncFromTokenStore);
    return unsubscribe;
  }, [syncFromTokenStore]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.storageArea !== window.localStorage) return;
      syncFromTokenStore();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromTokenStore]);

  const setTokens = useCallback(
    (tokenResponse) => {
      const access = tokenResponse?.accessToken || null;
      const refresh = tokenResponse?.refreshToken || null;
      const uid = tokenResponse?.userId || null;
      const normalizedRole = normalizeRole(tokenResponse?.role);

      if (tokenStore.setTokens) {
        tokenStore.setTokens({ accessToken: access, refreshToken: refresh });
      } else {
        if (access) tokenStore.setAccess?.(access);
        if (refresh) tokenStore.setRefresh?.(refresh);
      }

      if (uid && tokenStore.setUserId) tokenStore.setUserId(uid);
      if (normalizedRole && tokenStore.setRole) tokenStore.setRole(normalizedRole);

      syncFromTokenStore();
      if (normalizedRole) {
        setRole(normalizedRole);
      }
    },
    [syncFromTokenStore]
  );

  const clearTokens = useCallback(() => {
    tokenStore.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    setRole(null);
    setUserNo(null);
    emitLogout();
  }, []);

  const value = useMemo(
    () => ({
      isAuthed,
      isAdmin,
      role,
      userId,
      userNo,
      accessToken,
      refreshToken,
      setTokens,
      clearTokens,
    }),
    [
      isAuthed,
      isAdmin,
      role,
      userId,
      userNo,
      accessToken,
      refreshToken,
      setTokens,
      clearTokens,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
