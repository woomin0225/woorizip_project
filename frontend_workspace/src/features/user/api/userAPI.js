import { getApiBaseUrl } from '../../../app/config/env';
import { tokenStore } from '../../../app/http/tokenStore';
import { parseJwt } from '../../../app/providers/utils/jwt';
import { apiJson } from '../../../app/http/request';

const API_BASE_URL = getApiBaseUrl();

function getNormalizedAccessToken() {
  return tokenStore.getAccess();
}

function authHeader() {
  const token = getNormalizedAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    ...options,
  });
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = { message: text || 'User request failed' };
  }

  if (!response.ok) {
    const message = json?.message || text || 'User request failed';
    throw new Error(`[${response.status}] ${message}`);
  }
  return json?.data ?? json;
}

function getEmailFromAccessToken() {
  const accessToken = getNormalizedAccessToken();
  const payload = parseJwt(accessToken);
  if (!payload) return null;

  return (
    payload.emailId ||
    payload.email_id ||
    payload.email ||
    payload.userEmail ||
    payload.sub ||
    payload.username ||
    null
  );
}

function getCurrentUserEmail() {
  return (
    getEmailFromAccessToken() ||
    localStorage.getItem('emailId') ||
    localStorage.getItem('email')
  );
}

function getUserTypeFromAccessToken() {
  const accessToken = getNormalizedAccessToken();
  const payload = parseJwt(accessToken);
  if (!payload) return null;

  return (
    payload.type ||
    payload.userType ||
    payload.user_type ||
    payload.memberType ||
    null
  );
}

export async function getMyInfo() {
  const email = getCurrentUserEmail();
  if (!email) throw new Error('로그인 사용자 이메일 정보가 없습니다.');
  return request(`/api/user/${encodeURIComponent(email)}`);
}

export async function getUserByUserNo(userNo) {
  if (!userNo) throw new Error('사용자 번호가 없습니다.');
  return request(`/api/user/no/${encodeURIComponent(userNo)}`);
}

export async function getAdminUserListPage(page = 1, size = 100) {
  return request(
    `/api/user/list?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}&sort=createdAt&direct=DESC`
  );
}

export function isLessorType(type) {
  const normalized = String(type || '').toUpperCase();
  return normalized === 'LESSOR' || normalized === 'LANDLORD';
}

export function getIsLessorHint() {
  const tokenType = getUserTypeFromAccessToken();
  if (tokenType) return isLessorType(tokenType);

  const cachedType =
    sessionStorage.getItem('userType') || localStorage.getItem('userType');
  if (cachedType) return isLessorType(cachedType);

  return null;
}

export async function updateMyInfo(payload) {
  const email = getCurrentUserEmail();
  if (!email) throw new Error('로그인 사용자 이메일 정보가 없습니다.');
  return request(`/api/user/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function withdrawMyAccount() {
  try {
    const { data } = await apiJson().patch('/api/user/withdraw');
    return data?.data ?? data;
  } catch (err) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      '회원탈퇴 처리에 실패했습니다.';
    throw new Error(`[${status}] ${message}`);
  }
}
