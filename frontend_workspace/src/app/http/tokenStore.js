// src/app/http/tokenStore.js
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USERID_KEY = 'userId';
const ROLE_KEY = 'role';
// 사용자 유형은 화면에서 빠르게 권한 힌트를 보여 줄 때 참고한다.
// 다만 오래 남아 있으면 이전 로그인 정보가 섞일 수 있어서 clear()에서 반드시 같이 지운다.
const USER_TYPE_KEY = 'userType';

export const tokenStore = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccess(token) {
    if (!token) return;
    localStorage.setItem(ACCESS_KEY, token);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  setRefresh(token) {
    if (!token) return;
    localStorage.setItem(REFRESH_KEY, token);
  },
  getUserId() {
    return localStorage.getItem(USERID_KEY);
  },
  setUserId(userId) {
    if (!userId) return;
    localStorage.setItem(USERID_KEY, userId);
  },
  getRole() {
    return localStorage.getItem(ROLE_KEY);
  },
  setRole(role) {
    if (!role) return;
    localStorage.setItem(ROLE_KEY, role);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERID_KEY);
    localStorage.removeItem(ROLE_KEY);
    // accessToken만 지우고 userType을 남겨 두면,
    // 다음 로그인 사용자가 잘못된 권한으로 보일 수 있다.
    localStorage.removeItem(USER_TYPE_KEY);
    sessionStorage.removeItem(USER_TYPE_KEY);
  },
};
