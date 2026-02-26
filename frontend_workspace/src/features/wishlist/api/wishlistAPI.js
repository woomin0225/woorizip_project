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

export async function deleteWishlist(wishNo) {
  return request(`/api/wishlist/delete/${wishNo}`, { method: 'DELETE' });
}
