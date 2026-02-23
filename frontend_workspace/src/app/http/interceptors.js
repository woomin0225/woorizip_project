// src/app/http/interceptors.js
import { axiosInstance } from './axiosInstance';
import { tokenStore } from './tokenStore';
import { emitLogout } from './authEvents';

let isRefreshing = false;
let waitQueue = []; // { resolve, reject }

function resolveQueue(token) {
  waitQueue.forEach(({ resolve }) => resolve(token));
  waitQueue = [];
}

function rejectQueue(err) {
  waitQueue.forEach(({ reject }) => reject(err));
  waitQueue = [];
}

function attachAccess(config, accessToken) {
  if (!config.headers) config.headers = {};
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
}

// refreshToken도 Bearer 중복 방지
function toBearer(token) {
  if (!token) return null;
  const t = String(token).trim();
  const pure = t.startsWith('Bearer ') ? t.slice('Bearer '.length).trim() : t;
  return pure ? `Bearer ${pure}` : null;
}

// 백엔드 응답이 ApiResponse로 감싸져도 토큰을 찾게 처리
function unwrap(body) {
  return body?.data ?? body;
}

// access/refresh 토큰 키 이름이 달라도 대응
function normalizeTokenPayload(payload) {
  const p = payload ?? {};
  const accessToken = p.accessToken || null;
  const refreshToken = p.refreshToken || null;
  const role = p.role || null;
  const userId = p.userId || null;
  return { accessToken, refreshToken, userId, role, raw: p };
}

export function setupInterceptors({ onLogout } = {}) {
  if (axiosInstance.__interceptorsInstalled) return;
  axiosInstance.__interceptorsInstalled = true;

  const doLogout = () => {
    tokenStore.clear();
    try {
      emitLogout?.();
    } catch (_) {}
    onLogout?.();
  };

  // 1) Request: accessToken 자동 주입
  axiosInstance.interceptors.request.use(
    (config) => {
      const access = tokenStore.getAccess();

      // 특정 요청은 access 자동첨부를 막을 수 있음(확장용)
      if (config?.skipAttachAccess) return config;

      if (access) attachAccess(config, access);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2) Response: 401이면 refresh 후 원래 요청 재시도
  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;

      if (!originalRequest || !status) return Promise.reject(error);

      const url = originalRequest.url || '';

      // refresh 제외 대상들
      const isRefreshCall = url.includes('/auth/refresh');
      const isLoginCall = url.includes('/auth/login');
      const isLogoutCall = url.includes('/auth/logout');

      // 요청별로 refresh를 막는 플래그
      const skipAuthRefresh = originalRequest.skipAuthRefresh === true;

      // 무한루프 방지
      if (originalRequest._retry) return Promise.reject(error);

      // refresh/login/logout 자체에서 401/403이면 refresh 시도하지 말고 로그아웃
      if (
        (status === 401 || status === 403) &&
        (isRefreshCall || isLoginCall || isLogoutCall || skipAuthRefresh)
      ) {
        doLogout();
        return Promise.reject(error);
      }

      // 일반 API 요청의 401만 refresh 시도
      if (
        status === 401 &&
        !isRefreshCall &&
        !isLoginCall &&
        !isLogoutCall &&
        !skipAuthRefresh
      ) {
        originalRequest._retry = true;

        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) {
          doLogout();
          return Promise.reject(error);
        }

        // refresh 진행 중이면 queue 대기
        if (isRefreshing) {
          try {
            const newAccess = await new Promise((resolve, reject) => {
              waitQueue.push({ resolve, reject });
            });
            attachAccess(originalRequest, newAccess);
            return axiosInstance(originalRequest);
          } catch (e) {
            return Promise.reject(e);
          }
        }

        isRefreshing = true;

        try {
          // refresh 요청(permitAll) / RefreshToken 헤더로 전달
          // - refresh 요청도 request interceptor가 Authorization(만료된 access)을 붙일 수 있지만
          //   백엔드는 /auth/** permitAll + shouldNotFilter이므로 문제없음.
          const resp = await axiosInstance.post(
            '/auth/refresh',
            { extendLogin: false },
            { headers: { RefreshToken: toBearer(refreshToken) } }
          );

          // 응답 포맷이 ApiResponse 또는 raw 모두 대응
          const payload = unwrap(resp?.data);
          const token = normalizeTokenPayload(payload);

          if (!token.accessToken) {
            throw new Error('refresh ok but accessToken missing');
          }

          tokenStore.setAccess(token.accessToken);
          if (token.refreshToken) tokenStore.setRefresh(token.refreshToken);
          if (token.userId) tokenStore.setUserId(token.userId);
          if (token.role) tokenStore.setRole(token.role);

          resolveQueue(token.accessToken);

          // 원래 요청에 새 access 부착 후 재요청
          attachAccess(originalRequest, token.accessToken);
          return axiosInstance(originalRequest);
        } catch (e) {
          rejectQueue(e);
          doLogout();
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}
