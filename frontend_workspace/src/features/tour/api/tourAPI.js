import { getApiBaseUrl } from '../../../app/config/env';

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
    json = { message: text || 'Tour request failed' };
  }

  if (!response.ok) {
    const message = json?.message || text || 'Tour request failed';
    throw new Error(`[${response.status}] ${message}`);
  }
  return json?.data ?? json;
}

async function requestCandidates(candidates = [], options = {}) {
  let lastError = null;
  // 서버 버전별 엔드포인트 차이를 순차 시도
  for (const path of candidates) {
    try {
      return await request(path, options);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Tour request failed');
}

function normalizeTourStatus(item) {
  if (!item || typeof item !== 'object') return item;
  return item;
}

export async function createTour(roomNo, payload) {
  const data = await request(`/api/tour/insert/${roomNo}`, { method: 'POST', body: JSON.stringify(payload) });
  return normalizeTourStatus(data);
}

export async function getTourPage(page = 1, size = 8) {
  const data = await request(`/api/tour/list/me?page=${page}&size=${size}`);
  return {
    content: Array.isArray(data?.content) ? data.content.map(normalizeTourStatus) : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function getOwnerTourPage(page = 1, size = 8) {
  const data = await requestCandidates([
    `/api/tour/owner/me?page=${page}&size=${size}`,
    `/api/tour/lessor/me?page=${page}&size=${size}`,
    `/api/tour/list/owner?page=${page}&size=${size}`,
    `/api/tour/owner/list?page=${page}&size=${size}`,
    `/api/tour/list/lessor?page=${page}&size=${size}`,
    `/api/tour/lessor/list?page=${page}&size=${size}`,
  ]);
  return {
    content: Array.isArray(data?.content) ? data.content.map(normalizeTourStatus) : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function getTour(tourNo) {
  const data = await request(`/api/tour/${tourNo}`);
  return normalizeTourStatus(data);
}

export async function updateTour(tourNo, payload) {
  return request(`/api/tour/update/${tourNo}`, { method: 'POST', body: JSON.stringify(payload) });
}

function toTimeHHMM(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const m = /(\d{2}):(\d{2})/.exec(raw);
  if (m) return `${m[1]}:${m[2]}`;

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return '';
}

function normalizeTourRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.tours)) return data.tours;
  if (Array.isArray(data?.reservations)) return data.reservations;
  return [];
}

function isBlockingStatus(status) {
  const normalized = String(status || '').toUpperCase();
  return !['REJECTED', 'CANCELED', 'CANCELLED', 'EXPIRED'].includes(normalized);
}

export async function getReservedTourTimes(roomNo, visitDate) {
  if (!roomNo || !visitDate) return [];

  const query = `visitDate=${encodeURIComponent(visitDate)}`;
  const data = await requestCandidates([
    `/api/tour/reserved-times?roomNo=${encodeURIComponent(roomNo)}&${query}`,
    `/api/tour/room/${roomNo}/schedule?${query}`,
    `/api/tour/room/${roomNo}?${query}`,
    `/api/tour/list/room/${roomNo}?${query}`,
    `/api/tour/availability/${roomNo}?${query}`,
    `/api/tour/reserved/${roomNo}?${query}`,
  ]);

  const rows = normalizeTourRows(data);
  const times = rows
    .filter((row) => {
      if (typeof row === 'string') return true;
      return isBlockingStatus(row?.status);
    })
    .map((row) => {
      if (typeof row === 'string') return toTimeHHMM(row);
      return toTimeHHMM(row?.visitTime || row?.time || row?.reservedTime);
    })
    .filter(Boolean);

  return Array.from(new Set(times));
}

export async function decideTour(tourNo, status, reason = '') {
  const normalizedStatus = String(status || '').toUpperCase();
  // 반려 사유는 REJECTED일 때만 전달
  const body = JSON.stringify({
    status: normalizedStatus,
    rejectionReason: normalizedStatus === 'REJECTED' ? reason : '',
  });
  return requestCandidates(
    [
      `/api/tour/approve/${tourNo}`,
      `/api/tour/decision/${tourNo}`,
      `/api/tour/status/${tourNo}`,
      `/api/tour/update/${tourNo}`,
    ],
    { method: 'POST', body }
  );
}
