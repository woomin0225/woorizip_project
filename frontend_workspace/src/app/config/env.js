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
