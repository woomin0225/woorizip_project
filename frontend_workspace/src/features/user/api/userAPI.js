import { getApiBaseUrl } from '../../../app/config/env';
import { parseJwt } from '../../../app/providers/utils/jwt';

const API_BASE_URL = getApiBaseUrl();

function authHeader() {
  const token = localStorage.getItem('accessToken');
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
  const accessToken = localStorage.getItem('accessToken');
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

export async function getMyInfo() {
  const email = getCurrentUserEmail();
  if (!email) throw new Error('로그인 사용자 이메일 정보가 없습니다.');
  return request(`/api/user/${encodeURIComponent(email)}`);
}

export async function updateMyInfo(payload) {
  const email = getCurrentUserEmail();
  if (!email) throw new Error('로그인 사용자 이메일 정보가 없습니다.');
  return request(`/api/user/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

