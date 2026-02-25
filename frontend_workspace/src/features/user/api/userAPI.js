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
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(json?.message || 'User request failed');
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
