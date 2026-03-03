import { getApiBaseUrl } from '../../../app/config/env';
import { parseJwt } from '../../../app/providers/utils/jwt';

const API_BASE_URL = getApiBaseUrl();

function getNormalizedAccessToken() {
  const raw = localStorage.getItem('accessToken');
  if (!raw) return null;

  let token = String(raw).trim();
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1).trim();
  }
  if (token.startsWith('Bearer ')) {
    token = token.slice('Bearer '.length).trim();
  }
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  if (token !== raw) {
    localStorage.setItem('accessToken', token);
  }
  return token;
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

export function isLessorType(type) {
  const normalized = String(type || '').toUpperCase();
  return normalized === 'LESSOR' || normalized === 'LANDLORD';
}

export function getIsLessorHint() {
  const tokenType = getUserTypeFromAccessToken();
  if (tokenType) return isLessorType(tokenType);

  const cachedType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
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
  return request('/api/user/withdraw', {
    method: 'PATCH',
  });
}

