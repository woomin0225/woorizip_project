import { getApiBaseUrl } from '../../../app/config/env';

const API_BASE_URL = getApiBaseUrl();

function getAuthHeaders() {
  const accessToken = localStorage.getItem('accessToken');

  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function buildUrl(path, query = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}

async function request(path, { method = 'GET', body, query, headers } = {}) {
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...getAuthHeaders(),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const raw = await response.text();
  let parsed = null;

  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (_) {
    parsed = { message: raw };
  }

  if (!response.ok) {
    throw normalizeApiError(parsed, response.status);
  }

  return parsed;
}

function normalizeApiError(payload, status = 500) {
  return {
    message:
      payload?.message || payload?.error || '요청 처리 중 오류가 발생했습니다.',
    code: payload?.code || payload?.errorCode || 'UNKNOWN_ERROR',
    status,
  };
}

function unwrapData(payload) {
  return payload?.data ?? payload?.body ?? payload;
}

export async function checkId(emailId) {
  const response = await request('/api/user/check-id', {
    method: 'POST',
    query: { email_id: emailId },
  });

  const body = unwrapData(response);
  const message = response?.message || body;
  const isAvailable =
    body === 'ok' || response?.body === 'ok' || String(message).includes('ok');

  return { isAvailable, raw: response };
}

export async function signup(payload) {
  const response = await request('/api/user/signup', {
    method: 'POST',
    body: payload,
  });

  return unwrapData(response);
}

export async function login(payload) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: payload,
  });

  return unwrapData(response);
}

export async function findId(payload) {
  const response = await request('/api/user/find-id', {
    method: 'POST',
    body: payload,
  });

  return unwrapData(response);
}

export async function findPassword(payload) {
  const response = await request('/api/user/find-password', {
    method: 'POST',
    body: payload,
  });

  return unwrapData(response);
}

export { normalizeApiError };
