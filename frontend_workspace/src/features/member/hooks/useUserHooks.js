import { useAuth } from '../../../app/providers/AuthProvider';
import { useState, useEffect, useCallback } from 'react';
import { findId as findIdApi } from '../api/authApi';

function parseJwtPayload(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
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
    phoneCode: '',
    type: 'USER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'emailId') setIsIdChecked(false);
    if (name === 'phone') {
      setIsPhoneCodeSent(false);
      setIsPhoneVerified(false);
      setPhoneCode('');
      setForm((prev) => ({ ...prev, phoneCode: '' }));
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

  const handleSendPhoneCode = () => {
    const phone = String(form.phone || '').replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 11) {
      alert('휴대폰 번호를 올바르게 입력해주세요.');
      return;
    }
    const issued = String(Math.floor(100000 + Math.random() * 900000));
    setPhoneCode(issued);
    setIsPhoneCodeSent(true);
    setIsPhoneVerified(false);
    alert(`인증번호 ${issued}가 발송되었습니다.`);
  };

  const handleVerifyPhoneCode = () => {
    if (!isPhoneCodeSent) {
      alert('먼저 인증번호 발송을 진행해주세요.');
      return;
    }
    if (String(form.phoneCode || '').trim() !== phoneCode) {
      alert('인증번호가 일치하지 않습니다.');
      setIsPhoneVerified(false);
      return;
    }
    setIsPhoneVerified(true);
    alert('휴대폰 인증이 완료되었습니다.');
  };

  const handleCheckId = async () => {
    if (!form.emailId) return alert('이메일 아이디를 입력해주세요.');

    try {
      const res = await fetch(
        `http://localhost:8080/api/user/check-id?email_id=${form.emailId}`,
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
      const res = await fetch('http://localhost:8080/api/user/signup', {
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
    isPhoneCodeSent,
    isPhoneVerified,
    handleChange,
    handleCheckId,
    handleSendPhoneCode,
    handleVerifyPhoneCode,
    handleSubmit,
  };
}

export const useFindId = () => {
  const [form, setForm] = useState({ name: '', phone: '', code: '' });
  const [foundId, setFoundId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSendCode = () => {
    if (!form.name || !form.phone) {
      alert('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }
    alert('인증번호 1234가 발송되었습니다.');
    setIsCodeSent(true);
  };

  const handleVerifyCode = () => {
    if (form.code === '1234') {
      alert('인증되었습니다.');
      setIsVerified(true);
    } else {
      alert('인증번호가 일치하지 않습니다.');
    }
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
      const phoneCandidates = [...new Set([rawPhone, normalizedPhone].filter(Boolean))];

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
            String(apiError?.message || '').includes('일치하는 회원 정보가 없습니다');

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
    isCodeSent,
    isVerified,
    handleChange,
    handleSendCode,
    handleVerifyCode,
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
      const res = await fetch('http://localhost:8080/auth/login', {
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

      // JWT payload 추출 함수 추가
      function parseJwtPayload(token) {
        const base64 = token.split('.')[1];
        const json = atob(base64);
        return JSON.parse(json);
      }

      const payload = parseJwtPayload(data.accessToken);

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
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
  const [method, setMethod] = useState('email');
  const [form, setForm] = useState({ emailId: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const targetValue = method === 'email' ? form.emailId : form.phone;
      console.log(`인증 요청: [${method}] ${targetValue}`);

      setTimeout(() => {
        setMessage(
          '인증이 완료되어 새로운 임시 비밀번호가 발급/전송 되었습니다.'
        );
        setLoading(false);
      }, 1000);
    } catch {
      setMessage('인증에 실패했습니다. 입력 정보를 확인해주세요.');
      setLoading(false);
    }
  };

  return {
    method,
    setMethod,
    form,
    loading,
    message,
    handleChange,
    handleRequestNewPassword,
  };
}
