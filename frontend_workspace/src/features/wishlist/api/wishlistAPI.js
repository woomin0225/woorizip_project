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
  // wishlist API는 JSON 응답을 전제로 처리
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(json?.message || 'Wishlist request failed');
  return json?.data ?? json;
}

export async function getWishlistByUser(userNo, page = 1, size = 20) {
  const data = await request(`/api/wishlist/${userNo}?page=${page}&size=${size}`);
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data)) return data;
  return [];
}

export async function getWishlistPageByUser(userNo, page = 1, size = 8) {
  const data = await request(`/api/wishlist/${userNo}?page=${page}&size=${size}`);
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function addWishlist(roomNo) {
  return request(`/api/wishlist/add/${roomNo}`, { method: 'POST' });
}

export async function deleteWishlist(wishNo) {
  return request(`/api/wishlist/delete/${wishNo}`, { method: 'DELETE' });
}
