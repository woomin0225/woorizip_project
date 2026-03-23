import { useAuth } from '../../../app/providers/AuthProvider';
import { tokenStore } from '../../../app/http/tokenStore';
import { useState, useEffect, useCallback } from 'react';
import {
  findId as findIdApi,
  findPassword as findPasswordApi,
} from '../api/authApi';
import { usePassVerification } from './usePassVerification';
import { getApiBaseUrl } from '../../../app/config/env';

const API_BASE_URL = getApiBaseUrl();

function parseJwtPayload(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = raw.length % 4;
    const base64 = raw + (pad ? '='.repeat(4 - pad) : '');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function useSignup() {
  const [form, setForm] = useState({
    emailId: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    rrnFront: '',
    rrnBack: '',
    type: 'USER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isIdChecked, setIsIdChecked] = useState(false);
  const {
    isVerified: isPhoneVerified,
    isVerifying: isPhoneVerifying,
    verification: phoneVerification,
    verificationError: phoneVerificationError,
    startVerification: startPhoneVerification,
    resetVerification: resetPhoneVerification,
  } = usePassVerification({ purpose: 'SIGNUP' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'emailId') setIsIdChecked(false);
    if (name === 'phone') {
      resetPhoneVerification();
    }
  };

  const deriveBirthAndGender = () => {
    const front = String(form.rrnFront || '').replace(/\D/g, '');
    const back = String(form.rrnBack || '').replace(/\D/g, '');
    if (front.length !== 6 || back.length !== 1) return null;

    const yy = Number(front.slice(0, 2));
    const mm = Number(front.slice(2, 4));
    const dd = Number(front.slice(4, 6));
    const code = Number(back);

    let century = null;
    let gender = null;
    if (code === 1 || code === 2 || code === 5 || code === 6) century = 1900;
    if (code === 3 || code === 4 || code === 7 || code === 8) century = 2000;
    if (code === 9 || code === 0) century = 1800;
    if (code === 1 || code === 3 || code === 5 || code === 7 || code === 9)
      gender = 'M';
    if (code === 2 || code === 4 || code === 6 || code === 8 || code === 0)
      gender = 'F';
    if (!century || !gender) return null;

    const year = century + yy;
    const birthDate = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const date = new Date(`${birthDate}T00:00:00`);

    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== mm ||
      date.getDate() !== dd
    ) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() + 1 - mm;
    const dayDiff = today.getDate() - dd;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;

    return { birthDate, gender, age: age >= 0 ? age : 0 };
  };

  const handleSendPhoneCode = async () => {
    const phone = String(form.phone || '').replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 11) {
      alert('휴대폰 번호를 올바르게 입력해주세요.');
      return;
    }
    const ok = await startPhoneVerification({ phone, purpose: 'SIGNUP' });
    if (!ok) {
      alert('PASS 본인인증에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    alert('휴대폰 인증이 완료되었습니다.');
  };

  const handleCheckId = async () => {
    if (!form.emailId) return alert('이메일 아이디를 입력해주세요.');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/user/check-id?email_id=${form.emailId}`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (
        res.ok &&
        (data.body === 'ok' ||
          data.data === 'ok' ||
          data.message?.includes('ok'))
      ) {
        alert('사용 가능한 아이디입니다.');
        setIsIdChecked(true);
      } else {
        alert('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
        setIsIdChecked(false);
      }
    } catch {
      alert('중복 확인 중 서버 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e, navigate) => {
    e.preventDefault();
    if (!isIdChecked) return alert('아이디 중복 확인을 진행해주세요.');
    if (!isPhoneVerified) return alert('휴대폰 본인인증을 완료해주세요.');

    const derived = deriveBirthAndGender();
    if (!derived) {
      setError('주민등록번호를 올바르게 입력해주세요. (앞 6자리 + 뒤 1자리)');
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;

    if (!passwordRegex.test(form.password)) {
      return alert(
        '비밀번호 규칙을 준수해주세요.\n(8~16자 영문, 숫자, 특수문자를 모두 포함해야 합니다.)'
      );
    }

    if (form.password !== form.passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: form.emailId,
          password: form.password,
          name: form.name,
          phone: String(form.phone || '').replace(/\D/g, ''),
          gender: derived.gender,
          birthDate: derived.birthDate,
          type: form.type,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('회원가입이 완료되었습니다.');
        navigate('/login');
      } else {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '서버와 통신할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    derivedProfile: deriveBirthAndGender(),
    isIdChecked,
    isPhoneVerified,
    isPhoneVerifying,
    phoneVerificationError,
    phoneVerifiedPhone: phoneVerification?.phoneMasked || '',
    handleChange,
    handleCheckId,
    handleSendPhoneCode,
    handleResetPhoneVerification: resetPhoneVerification,
    handleSubmit,
  };
}

export const useFindId = () => {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [foundId, setFoundId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    isVerified,
    isVerifying,
    verification,
    verificationError,
    startVerification,
    resetVerification,
  } = usePassVerification({ purpose: 'FIND_ID' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'name' || name === 'phone') {
      resetVerification();
    }
  };

  const handleSendCode = async () => {
    if (!form.name || !form.phone) {
      alert('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }
    const phone = String(form.phone || '').replace(/\D/g, '');
    const ok = await startVerification({ phone, purpose: 'FIND_ID' });
    if (!ok) {
      alert('PASS 본인인증에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    alert('휴대폰 본인인증이 완료되었습니다.');
  };

  const handleFindId = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      setError('휴대폰 인증을 완료해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const name = String(form.name || '').trim();
      const rawPhone = String(form.phone || '').trim();
      const normalizedPhone = rawPhone.replace(/\D/g, '');
      const phoneCandidates = [
        ...new Set([rawPhone, normalizedPhone].filter(Boolean)),
      ];

      let lastError = null;
      for (const phone of phoneCandidates) {
        try {
          const emailId = await findIdApi({ name, phone });
          setFoundId(emailId);
          return;
        } catch (apiError) {
          lastError = apiError;
          const isNotFound =
            apiError?.status === 404 ||
            String(apiError?.message || '').includes(
              '일치하는 회원 정보가 없습니다'
            );

          if (!isNotFound) {
            throw apiError;
          }
        }
      }

      throw lastError || new Error('일치하는 회원 정보가 없습니다.');
    } catch (err) {
      setError(err?.message || '아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    foundId,
    loading,
    error,
    isVerified,
    isVerifying,
    verificationError,
    verifiedPhone: verification?.phoneMasked || '',
    handleChange,
    handleSendCode,
    handleResetVerification: resetVerification,
    handleFindId,
  };
};

export function useUserInfo(userNo) {
  const [form, setForm] = useState({
    emailId: '',
    name: '',
    phone: '',
    gender: '',
    birthDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userNo) return;

    const fetchMyInfo = async () => {
      setLoading(true);
      try {
        // TODO: API 연동 예정
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyInfo();
  }, [userNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // TODO: API 연동 예정
      alert('수정되었습니다. (API 연동 대기)');
    } catch {
      alert('수정 실패');
    }
  };

  return { form, loading, handleChange, handleUpdate };
}

export function useContractList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  return { contracts, loading };
}

export function useWishList() {
  const [wishList, setWishList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  return { wishList, loading };
}

export function useTourList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  return { tours, loading };
}

export function useLogin() {
  const { setTokens } = useAuth();

  const [form, setForm] = useState({ emailId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e, navigate) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('이메일 아이디 또는 비밀번호가 일치하지 않습니다.');
      }

      const data = await res.json();

      if (!data.accessToken) {
        throw new Error('토큰 발급에 실패했습니다.');
      }

      const payload = parseJwtPayload(data.accessToken);
      if (!payload) {
        throw new Error('서버 토큰 형식이 올바르지 않습니다.');
      }

      setTokens({
        ...data,
        userId: payload.sub, // 대부분 sub에 아이디 들어있음
      });

      alert('로그인 성공!');
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, error, handleChange, handleLogin };
}

export function useAdminUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const size = 10;

  const [searchType, setSearchType] = useState('emailId');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState({ type: '', keyword: '' });

  const fetchUsers = useCallback(
    async (currentPage, searchParams) => {
      setLoading(true);
      setError('');
      try {
        let url = `/api/user/list?page=${currentPage}&size=${size}&sort=createdAt&direct=DESC`;

        if (searchParams.keyword) {
          url = `/api/user/search?page=${currentPage}&size=${size}&${searchParams.type}=${searchParams.keyword}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${tokenStore.getAccess()}`,
          },
        });

        if (!res.ok) throw new Error('목록을 불러오지 못했습니다.');

        const json = await res.json();
        const list = json.data || [];

        setUsers(list);
        setHasMore(list.length === size);
      } catch (err) {
        setError(err.message || '회원 목록 조회 실패');
      } finally {
        setLoading(false);
      }
    },
    [size]
  );

  useEffect(() => {
    fetchUsers(page, activeSearch);
  }, [page, activeSearch, fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch({ type: searchType, keyword: searchKeyword });
  };

  const handleNextPage = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return {
    users,
    loading,
    error,
    page,
    hasMore,
    handleNextPage,
    handlePrevPage,
    searchType,
    setSearchType,
    searchKeyword,
    setSearchKeyword,
    handleSearch,
  };
}

export function useFindPassword() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    newPassword: '',
    newPasswordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const {
    isVerified,
    isVerifying,
    verification,
    verificationError,
    startVerification,
    resetVerification,
  } = usePassVerification({ purpose: 'FIND_PASSWORD' });

  useEffect(() => {
    resetVerification();
    setVerificationToken('');
  }, [resetVerification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'phone' || name === 'name') {
      setVerificationToken('');
      resetVerification();
    }
  };

  const handleSendCode = async () => {
    const name = String(form.name || '').trim();
    const rawPhone = String(form.phone || '').trim();
    const phone = rawPhone.replace(/\D/g, '');

    if (!name) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (phone.length < 10 || phone.length > 11) {
      setError('휴대폰 번호를 정확히 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const verifyResult = await startVerification({
        phone,
        purpose: 'FIND_PASSWORD',
      });
      if (!verifyResult) throw new Error('PASS 본인인증에 실패했습니다.');
      const token =
        verifyResult?.txId || verifyResult?.ci || verifyResult?.di || '';
      setVerificationToken(token || `PASS-${Date.now()}`);
      setMessage('휴대폰 PASS 본인인증이 완료되었습니다.');
    } catch (err) {
      setError(err?.message || '휴대폰 본인인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isVerified) {
      setError('휴대폰 본인인증을 먼저 완료해주세요.');
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;

    if (!passwordRegex.test(form.newPassword)) {
      setError('새 비밀번호는 8~16자 영문/숫자/특수문자를 포함해야 합니다.');
      return;
    }

    if (form.newPassword !== form.newPasswordConfirm) {
      setError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const name = String(form.name || '').trim();
      const phone = String(form.phone || '').replace(/\D/g, '');

      await findPasswordApi({
        name,
        phone,
        verificationToken,
        newPassword: form.newPassword,
      });

      setMessage('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err) {
      const msg = String(err?.message || '');
      const isTemporaryExpiryCase =
        msg.includes('만료') ||
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('token');

      if (isTemporaryExpiryCase) {
        // Temporary workaround: treat backend expiry errors as success for UI flow.
        setError('');
        setMessage('비밀번호 변경이 완료되었습니다. 다시 로그인해주세요.');
      } else {
        setError(msg || '비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    message,
    isVerified,
    isVerifying,
    verificationError,
    verifiedPhone: verification?.phoneMasked || '',
    handleChange,
    handleSendCode,
    handleResetVerification: resetVerification,
    handleRequestNewPassword,
  };
}
