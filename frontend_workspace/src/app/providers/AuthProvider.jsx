// src/app/providers/AuthProvider.jsx
// AuthProvider (tokenStore + authEvents + role/isAdmin 일관 연결)

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import { tokenStore } from '../http/tokenStore';
import { subscribeAuthEvent, emitLogout } from '../http/authEvents';
import { extractRoleFromAccessToken } from './utils/jwt';
import { ROLES } from '../../shared/constants/roles';

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (!role) return null;
  // 백엔드/프론트 표기 혼재를 모두 ROLE_* 로 정규화
  if (role === 'admin' || role === 'ADMIN') return 'ROLE_ADMIN';
  if (role === 'user' || role === 'USER') return 'ROLE_USER';
  return role;
}

function computeRoleFromStores(accessToken) {
  // 1) tokenStore.role 우선
  const storedRole = normalizeRole(tokenStore.getRole?.());
  if (storedRole) return storedRole;

  // 2) JWT에서 추출 fallback (프로젝트에 extractRoleFromAccessToken 존재하므로 활용)
  const jwtRole = normalizeRole(extractRoleFromAccessToken(accessToken));
  return jwtRole || null;
}

function computeIsAdmin(role) {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === 'ROLE_ADMIN' || r === 'ADMIN';
}

export default function AuthProvider({ children }) {
  // tokenStore 스냅샷으로 초기 상태
  const [accessToken, setAccessToken] = useState(tokenStore.getAccess());
  const [refreshToken, setRefreshToken] = useState(tokenStore.getRefresh());
  const [userId, setUserId] = useState(tokenStore.getUserId?.() || null);
  const [role, setRole] = useState(
    computeRoleFromStores(tokenStore.getAccess())
  );

  const isAuthed = Boolean(accessToken);
  const isAdmin = useMemo(() => computeIsAdmin(role), [role]);

  // authEvents(로그아웃) 구독: 인터셉터에서 emitLogout() 발생 시 Provider 상태 동기화
  useEffect(() => {
    const unsubscribe = subscribeAuthEvent(() => {
      // interceptors에서 tokenStore.clear()가 이미 수행되었을 수 있으므로
      // 상태를 tokenStore 기준으로 “재동기화”만 해도 안전
      setAccessToken(tokenStore.getAccess());
      setRefreshToken(tokenStore.getRefresh());
      setUserId(tokenStore.getUserId?.() || null);
      setRole(computeRoleFromStores(tokenStore.getAccess()));
    });
    return unsubscribe;
  }, []);

  // 토큰 저장: 로그인 응답(TokenResponse)을 받아 tokenStore + Provider 상태 동기화
  const setTokens = useCallback((tokenResponse) => {
    const access = tokenResponse?.accessToken || null;
    const refresh = tokenResponse?.refreshToken || null;
    const uid = tokenResponse?.userId || null;
    const r = normalizeRole(tokenResponse?.role);

    // tokenStore에 저장 (프로젝트 tokenStore 구현에 맞춰 안전하게 호출)
    if (tokenStore.setTokens) {
      tokenStore.setTokens({ accessToken: access, refreshToken: refresh });
    } else {
      if (access) tokenStore.setAccess?.(access);
      if (refresh) tokenStore.setRefresh?.(refresh);
    }

    if (uid && tokenStore.setUserId) tokenStore.setUserId(uid);
    if (r && tokenStore.setRole) tokenStore.setRole(r);

    // Provider 상태 동기화
    const nextAccess = tokenStore.getAccess();
    setAccessToken(nextAccess);
    setRefreshToken(tokenStore.getRefresh());
    setUserId(tokenStore.getUserId?.() || null);
    setRole(r || computeRoleFromStores(nextAccess));
  }, []);

  // 토큰 제거 + 로그아웃 브로드캐스트
  const clearTokens = useCallback(() => {
    tokenStore.clear();
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    setRole(null);

    // Provider에서 로그아웃을 수행한 경우에도 앱 전체에 브로드캐스트
    emitLogout();
  }, []);

  const value = useMemo(
    () => ({
      // 상태
      isAuthed,
      isAdmin,
      role,
      userId,
      accessToken,
      refreshToken,

      // 액션
      setTokens,
      clearTokens,
    }),
    [
      isAuthed,
      isAdmin,
      role,
      userId,
      accessToken,
      refreshToken,
      setTokens,
      clearTokens,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
