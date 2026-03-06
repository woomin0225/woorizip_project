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
    json = { message: text || 'Contract request failed' };
  }

  if (!response.ok) {
    const message = json?.message || text || 'Contract request failed';
    throw new Error(`[${response.status}] ${message}`);
  }
  return json?.data ?? json;
}

async function requestCandidates(candidates = [], options = {}) {
  let lastError = null;
  // 서버 라우트 편차를 고려한 fallback 요청
  for (const path of candidates) {
    try {
      return await request(path, options);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Contract request failed');
}

export async function getMyContractsPage(page = 1, size = 8) {
  const data = await request(`/api/contract/user/me?page=${page}&size=${size}`);
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function getOwnerContractsPage(page = 1, size = 8) {
  const data = await requestCandidates([
    `/api/contract/owner/me?page=${page}&size=${size}`,
    `/api/contract/lessor/me?page=${page}&size=${size}`,
    `/api/contract/owner/list?page=${page}&size=${size}`,
    `/api/contract/list/owner?page=${page}&size=${size}`,
    `/api/contract/list/lessor?page=${page}&size=${size}`,
    `/api/contract/lessor/list?page=${page}&size=${size}`,
  ]);
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function getContract(contractNo) {
  return request(`/api/contract/${contractNo}`);
}

export async function applyContract(roomNo, payload) {
  return request(`/api/contract/insert/${roomNo}`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function requestContractAmendment(contractNo, payload) {
  return request(`/api/contract/amendment/request/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelContract(contractNo, reason = '') {
  return request(`/api/contract/cancel/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// 아래 3개는 백엔드 연동 포인트용 템플릿입니다.
// 실제 엔드포인트 스펙이 정해지면 path/payload를 맞춰서 연결하면 됩니다.
export async function createElectronicContract(contractNo, payload) {
  return request(`/api/contract/e-contract/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyElectronicSignature(contractNo, payload) {
  return request(`/api/contract/signature/verify/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestContractPayment(contractNo, payload) {
  return request(`/api/contract/payment/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function decideContract(contractNo, status, reason = '', currentStatus = '') {
  const normalizedStatus = String(status || '').toUpperCase();
  const normalizedCurrentStatus = String(currentStatus || '').toUpperCase();

  try {
    return await request(`/api/contract/decision/${contractNo}`, {
      method: 'POST',
      body: JSON.stringify({
        status: normalizedStatus,
        reason: normalizedStatus === 'REJECTED' ? reason : '',
        currentStatus: normalizedCurrentStatus,
      }),
    });
  } catch (e) {
    const msg = String(e?.message || '');
    const isEndpointMissing = msg.startsWith('[404]') || msg.startsWith('[405]') || msg.startsWith('[501]');
    if (!isEndpointMissing) {
      throw e;
    }
    // 하위 호환: decision 엔드포인트가 없는 서버 버전 fallback
  }

  if (normalizedCurrentStatus === 'AMENDMENT_REQUESTED') {
    // 수정요청 건은 전용 승인/반려 API 사용
    return request(`/api/contract/amendment/decide/${contractNo}`, {
      method: 'POST',
      body: JSON.stringify({
        approved: normalizedStatus === 'APPROVED',
        reason: normalizedStatus === 'REJECTED' ? reason : '',
      }),
    });
  }

  if (normalizedStatus === 'REJECTED') {
    return cancelContract(contractNo, reason);
  }

  if (normalizedStatus === 'APPROVED') {
    // 일반 승인 시 전자계약 생성으로 연결
    return createElectronicContract(contractNo, {});
  }

  throw new Error('지원하지 않는 계약 상태 처리입니다.');
}
