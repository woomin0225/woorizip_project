import { useCallback, useMemo, useState } from 'react';
import {
  getPassVerificationResult,
  isPassMockMode,
  maskPhone,
  normalizePhone,
  startPassVerification,
  verifyPassMock,
} from '../api/passAuthApi';

const STORAGE_KEY_PREFIX = 'passVerificationStateV2';
// 본인인증 유효시간(30분)
const VERIFICATION_TTL_MS = 30 * 60 * 1000;
const POLLING_INTERVAL_MS = 2000;
const POLLING_TIMEOUT_MS = 120000;

function now() {
  return Date.now();
}

function isExpired(verifiedAt) {
  if (!verifiedAt) return true;
  const t = new Date(verifiedAt).getTime();
  if (Number.isNaN(t)) return true;
  return now() - t > VERIFICATION_TTL_MS;
}

function getStorageKey(purpose = 'GENERAL') {
  return `${STORAGE_KEY_PREFIX}:${purpose}`;
}

function readSaved(purpose = 'GENERAL') {
  try {
    const raw = sessionStorage.getItem(getStorageKey(purpose));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.verifiedAt || isExpired(parsed.verifiedAt)) return null;
    if (parsed?.purpose && parsed.purpose !== purpose) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSaved(state, purpose = 'GENERAL') {
  try {
    const key = getStorageKey(purpose);
    if (!state) {
      sessionStorage.removeItem(key);
      // 이전 버전 전역 키 정리
      sessionStorage.removeItem('passVerificationStateV1');
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // 저장 실패는 무시
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function finalStatus(status) {
  return ['VERIFIED', 'FAILED', 'REJECTED', 'EXPIRED'].includes(status);
}

export function usePassVerification(defaultOptions = {}) {
  const defaultPurpose = defaultOptions.purpose || 'GENERAL';
  const [verification, setVerification] = useState(() => readSaved(defaultPurpose));
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const isVerified = useMemo(() => {
    if (!verification) return false;
    return !isExpired(verification.verifiedAt);
  }, [verification]);

  const resetVerification = useCallback(() => {
    setVerification(null);
    setVerificationError('');
    writeSaved(null, defaultPurpose);
  }, [defaultPurpose]);

  const startVerification = useCallback(
    async (options = {}) => {
      const purpose = options.purpose || defaultOptions.purpose || 'GENERAL';
      const phone = normalizePhone(options.phone);
      const useMock = options.forceMock ?? isPassMockMode();

      if (phone.length < 10 || phone.length > 11) {
        setVerificationError('휴대폰 번호를 정확히 입력해주세요.');
        return false;
      }

      setIsVerifying(true);
      setVerificationError('');

      try {
        let result;

        if (useMock) {
          result = await verifyPassMock({ phone, purpose });
        } else {
          const started = await startPassVerification({ phone, purpose });
          const txId = started?.txId || started?.transactionId;
          const authUrl = started?.authUrl || started?.verificationUrl;

          if (!txId) throw new Error('PASS 거래번호(txId)를 받지 못했습니다.');

          if (authUrl && typeof window !== 'undefined') {
            window.open(authUrl, '_blank', 'noopener,noreferrer');
          }

          const startedAt = now();
          let polled = null;
          // PASS 결과를 완료 상태까지 폴링
          while (now() - startedAt < POLLING_TIMEOUT_MS) {
            await wait(POLLING_INTERVAL_MS);
            polled = await getPassVerificationResult(txId);
            const status = String(polled?.status || '').toUpperCase();
            if (finalStatus(status)) break;
          }

          result = polled;
        }

        const status = String(result?.status || '').toUpperCase();
        if (status !== 'VERIFIED') {
          const msg = result?.message || '휴대폰 본인인증이 완료되지 않았습니다.';
          throw new Error(msg);
        }

        const next = {
          status: 'VERIFIED',
          txId: result?.txId || result?.transactionId || '',
          purpose,
          verifiedAt: result?.verifiedAt || new Date().toISOString(),
          phone: phone,
          phoneMasked:
            result?.user?.phoneMasked ||
            result?.phoneMasked ||
            maskPhone(result?.user?.phone || phone),
          userName: result?.user?.name || '',
          ci: result?.user?.ci || '',
          di: result?.user?.di || '',
        };

        setVerification(next);
        writeSaved(next, purpose);
        return next;
      } catch (error) {
        setVerification(null);
        writeSaved(null, purpose);
        setVerificationError(
          error?.message || '휴대폰 본인인증 처리 중 오류가 발생했습니다.'
        );
        return null;
      } finally {
        setIsVerifying(false);
      }
    },
    [defaultPurpose]
  );

  return {
    isVerified,
    isVerifying,
    verification,
    verificationError,
    startVerification,
    resetVerification,
  };
}
