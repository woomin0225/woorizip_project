import { apiJson } from '../../../app/http/request';

const PASS_START_ENDPOINT = '/auth/pass/start';
const PASS_RESULT_ENDPOINT = '/auth/pass/result';
const MOCK_DELAY_MS = 700;

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

export function isPassMockMode() {
  const envValue =
    typeof process !== 'undefined'
      ? process.env?.REACT_APP_PASS_AUTH_MOCK
      : undefined;
  return toBoolean(envValue, true);
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export function maskPhone(phone) {
  const p = normalizePhone(phone);
  if (p.length < 10) return p;
  return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`.replace(
    /(\d{3})-(\d+)-(\d{4})/,
    (_, a, b, c) => `${a}-${'*'.repeat(Math.max(b.length, 2))}-${c}`
  );
}

export async function startPassVerification(payload) {
  const { data } = await apiJson().post(PASS_START_ENDPOINT, payload);
  return data;
}

export async function getPassVerificationResult(txId) {
  const { data } = await apiJson().get(PASS_RESULT_ENDPOINT, {
    params: { txId },
  });
  return data;
}

export async function verifyPassMock(payload = {}) {
  const phone = normalizePhone(payload.phone);

  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });

  return {
    status: 'VERIFIED',
    txId: `MOCK-${Date.now()}`,
    verifiedAt: new Date().toISOString(),
    user: {
      name: 'PASS 테스트사용자',
      phone,
      phoneMasked: maskPhone(phone),
      ci: 'MOCK_CI',
      di: 'MOCK_DI',
    },
  };
}

