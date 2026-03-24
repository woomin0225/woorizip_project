// src/app/config/env.js

function getHostedProductionApiBaseUrl() {
  if (typeof window === 'undefined') return null;

  const { hostname, protocol } = window.location;
  if (!hostname) return null;

  if (hostname === 'www.woorizip.life' || hostname === 'woorizip.life') {
    return 'https://api.woorizip.life';
  }

  if (hostname === 'api.woorizip.life') {
    return 'https://api.woorizip.life';
  }

  if (protocol === 'https:' && hostname.endsWith('.woorizip.life')) {
    return 'https://api.woorizip.life';
  }

  return null;
}

export function getApiBaseUrl() {
  const vite =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_API_BASE_URL
      : undefined;

  const cra =
    typeof process !== 'undefined'
      ? process.env?.REACT_APP_API_BASE_URL
      : undefined;

  return (
    vite ||
    cra ||
    getHostedProductionApiBaseUrl() ||
    'http://localhost:8080'
  ).replace(/\/$/, '');
}

export function getAiBaseUrl() {
  const vite =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_AI_BASE_URL
      : undefined;

  const cra =
    typeof process !== 'undefined'
      ? process.env?.REACT_APP_AI_BASE_URL
      : undefined;

  return (vite || cra || getApiBaseUrl()).replace(/\/$/, '');
}

export function getUploadBaseUrl() {
  return getApiBaseUrl();
}

export function buildUploadUrl(dir, fileName) {
  if (!fileName) return null;
  if (String(fileName).startsWith('http')) return fileName;

  const safeDir = String(dir || '').replace(/^\/+|\/+$/g, '');
  const safeFileName = String(fileName).replace(/^\/+/, '');
  return getApiAssetUrl(`${safeDir}/${safeFileName}`);
}

export function getApiAssetUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
