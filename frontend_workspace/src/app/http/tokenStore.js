// src/app/http/tokenStore.js
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USERID_KEY = 'userId';
const ROLE_KEY = 'role';
const USER_TYPE_KEY = 'userType';
const AUTH_KEYS = [ACCESS_KEY, REFRESH_KEY, USERID_KEY, ROLE_KEY, USER_TYPE_KEY];

let hasMigratedLegacyState = false;

function getStorage(kind) {
  if (typeof window === 'undefined') return null;

  try {
    return window[kind] ?? null;
  } catch (_) {
    return null;
  }
}

function getPrimaryStorage() {
  return getStorage('sessionStorage') || getStorage('localStorage');
}

function getLegacyStorage() {
  const primary = getPrimaryStorage();
  const local = getStorage('localStorage');

  if (!primary || !local || primary === local) {
    return null;
  }

  return local;
}

function normalizeTokenValue(token) {
  if (!token) return null;

  let normalized = String(token).trim();

  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1).trim();
  }
  if (normalized.startsWith('Bearer ')) {
    normalized = normalized.slice('Bearer '.length).trim();
  }
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }

  return normalized;
}

function removeAuthValue(key) {
  getPrimaryStorage()?.removeItem(key);
  getLegacyStorage()?.removeItem(key);
}

function writeAuthValue(key, value, { normalize = false } = {}) {
  const primary = getPrimaryStorage();
  if (!primary) return;

  const nextValue = normalize ? normalizeTokenValue(value) : value;
  if (nextValue == null) {
    removeAuthValue(key);
    return;
  }

  primary.setItem(key, nextValue);
  getLegacyStorage()?.removeItem(key);
}

function migrateLegacyAuthState() {
  if (hasMigratedLegacyState) return;
  hasMigratedLegacyState = true;

  const primary = getPrimaryStorage();
  const legacy = getLegacyStorage();
  if (!primary || !legacy) return;

  AUTH_KEYS.forEach((key) => {
    if (primary.getItem(key) != null) return;

    const legacyValue = legacy.getItem(key);
    if (legacyValue == null) return;

    primary.setItem(key, legacyValue);
    legacy.removeItem(key);
  });
}

function readAuthValue(key, { normalize = false } = {}) {
  migrateLegacyAuthState();

  const primary = getPrimaryStorage();
  const legacy = getLegacyStorage();
  const rawValue = primary?.getItem(key) ?? legacy?.getItem(key) ?? null;

  if (rawValue == null) {
    return null;
  }

  if (!normalize) {
    return rawValue;
  }

  const normalized = normalizeTokenValue(rawValue);
  if (normalized == null) {
    removeAuthValue(key);
    return null;
  }

  if (normalized !== rawValue) {
    writeAuthValue(key, normalized, { normalize: false });
  }

  return normalized;
}

export const tokenStore = {
  getAccess() {
    return readAuthValue(ACCESS_KEY, { normalize: true });
  },
  setAccess(token) {
    writeAuthValue(ACCESS_KEY, token, { normalize: true });
  },
  getRefresh() {
    return readAuthValue(REFRESH_KEY, { normalize: true });
  },
  setRefresh(token) {
    writeAuthValue(REFRESH_KEY, token, { normalize: true });
  },
  getUserId() {
    return readAuthValue(USERID_KEY);
  },
  setUserId(userId) {
    writeAuthValue(USERID_KEY, userId);
  },
  getRole() {
    return readAuthValue(ROLE_KEY);
  },
  setRole(role) {
    writeAuthValue(ROLE_KEY, role);
  },
  setTokens({ accessToken = null, refreshToken = null, userId = null, role = null } = {}) {
    this.setAccess(accessToken);
    this.setRefresh(refreshToken);
    this.setUserId(userId);
    this.setRole(role);
  },
  clear() {
    AUTH_KEYS.forEach(removeAuthValue);
  },
};
