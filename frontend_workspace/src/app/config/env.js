// src/app/config/env.js

export function getApiBaseUrl() {
  const vite =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_API_BASE_URL
      : undefined;

  const cra =
    typeof process !== 'undefined'
      ? process.env?.REACT_APP_API_BASE_URL
      : undefined;

  return (vite || cra || 'http://localhost:8080').replace(/\/$/, '');
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

export function getApiAssetUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
