// src/shared/utils/jwt.js
/**
 * 토큰 payload를 안전하게 파싱(서명검증은 서버가 함)
 * - role claim 이름은 프로젝트마다 다를 수 있어 "roles/role/authorities"를 모두 탐색
 */
function base64UrlDecode(str) {
  const pad = str.length % 4;
  const normalized =
    str.replace(/-/g, '+').replace(/_/g, '/') +
    (pad ? '='.repeat(4 - pad) : '');
  try {
    return decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(normalized);
  }
}

export function parseJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function extractRoleFromAccessToken(accessToken) {
  const payload = parseJwt(accessToken);
  if (!payload) return null;

  // 후보 claim들
  const candidates = [
    payload.role,
    payload.roles,
    payload.authorities,
    payload.auth,
    payload.scope,
  ];

  for (const c of candidates) {
    if (!c) continue;

    // string
    if (typeof c === 'string') {
      // "ROLE_ADMIN" 또는 "ROLE_USER" 또는 "ROLE_USER,ROLE_ADMIN"
      if (c.includes('ROLE_'))
        return c.split(/[,\s]+/).find((x) => x.startsWith('ROLE_')) || c;
    }

    // array
    if (Array.isArray(c)) {
      const found = c.find(
        (x) => typeof x === 'string' && x.startsWith('ROLE_')
      );
      if (found) return found;
    }
  }

  return null;
}

export function extractUserNoFromAccessToken(token) {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userNo || null;
  } catch (e) {
    console.error('JWT userNo parse error:', e);
    return null;
  }
}
