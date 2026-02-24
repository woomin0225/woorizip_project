import { useState, useEffect, useCallback } from 'react';

// 회원가입
export function useSignup() {
  const [form, setForm] = useState({
    emailId: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    gender: 'M',
    birthDate: '',
    type: 'USER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isIdChecked, setIsIdChecked] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'emailId') setIsIdChecked(false);
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
    } catch (err) {
      alert('중복 확인 중 서버 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e, navigate) => {
    e.preventDefault();
    if (!isIdChecked) return alert('아이디 중복 확인을 진행해주세요.');

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
    if (!passwordRegex.test(form.password)) {
      return alert(
        '비밀번호 규칙을 준수해주세요.\n(8~16자 영문, 숫자, 특수문자를 모두 포함해야 합니다.)'
      );
    }
    if (form.password !== form.passwordConfirm)
      return setError('비밀번호가 일치하지 않습니다.');

    setLoading(true);
    setError('');

    const payload = {
      emailId: form.emailId,
      password: form.password,
      name: form.name,
      phone: form.phone,
      gender: form.gender,
      birthDate: form.birthDate,
      type: form.type,
    };

    try {
      const res = await fetch('http://localhost:8080/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // [수정됨] res.ok(200번대 응답)면 성공으로 간주하도록 수정
      if (res.ok) {
        alert('회원가입이 완료되었습니다!');
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
    isIdChecked,
    handleChange,
    handleCheckId,
    handleSubmit,
  };
}

// 아이디 찾기
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
      const res = await axios.post('http://localhost:8080/api/user/find-id', {
        name: form.name,
        phone: form.phone,
      });
      setFoundId(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || '아이디 찾기 중 오류가 발생했습니다.'
      );
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

// 내 정보 조회 및 수정
export function useUserInfo(userNo) {
  const [form, setForm] = useState({
    emailId: '',
    name: '',
    phone: '',
    gender: '',
    birthDate: '',
  });
  const [loading, setLoading] = useState(true);

  // 초기 정보 불러오기
  useEffect(() => {
    if (!userNo) return;
    const fetchMyInfo = async () => {
      setLoading(true);
      try {
        // TODO: API 연동
        // const data = await getUserInfo(userNo);
        // setForm(data);
        console.log(`${userNo} 정보 불러오기 API 호출 대기`);
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
      // TODO: API 연동
      console.log('업데이트할 정보:', form);
      alert('수정되었습니다. (API 연동 대기)');
    } catch (err) {
      alert('수정 실패');
    }
  };

  return { form, loading, handleChange, handleUpdate };
}

// 계약 목록
export function useContractList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  return { contracts, loading };
}

// 찜 목록
export function useWishList() {
  const [wishList, setWishList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  return { wishList, loading };
}

// 투어 목록
export function useTourList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  return { tours, loading };
}

// 로그인
export function useLogin() {
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

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        alert('로그인 성공!');
        navigate('/');
      } else {
        throw new Error('토큰 발급에 실패했습니다.');
      }
    } catch (err) {
      const status = err.response?.status;
      const errorCode = err.response?.data?.code || 'UNKNOWN';

      if (status === 401) {
        // 인증 실패 (아이디 또는 비번 틀림)
        setError('이메일 아이디 또는 비밀번호가 일치하지 않습니다.');
      } else {
        // 그 외 400, 500 등 서버/네트워크 에러
        setError(`${errorCode} 에러: 관리자에게 문의하세요.`);
        console.error('System Error:', err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, error, handleChange, handleLogin };
}

// 관리자용 회원 목록 및 검색
export function useAdminUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 페이징 상태
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const size = 10;

  // 검색 상태
  const [searchType, setSearchType] = useState('emailId'); // emailId, name, phone
  const [searchKeyword, setSearchKeyword] = useState('');

  // 실제 API 요청에 쓰일 검색어 상태 (버튼 클릭 시 업데이트)
  const [activeSearch, setActiveSearch] = useState({ type: '', keyword: '' });

  const fetchUsers = useCallback(
    async (currentPage, searchParams) => {
      setLoading(true);
      setError('');
      try {
        let url = `/api/user/list?page=${currentPage}&size=${size}&sort=createdAt&direct=DESC`;

        if (searchParams.keyword) {
          // 검색어가 있을 경우 /api/user/search 사용
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
        // 받아온 데이터가 size보다 작으면 다음 페이지가 없다고 판단
        setHasMore(list.length === size);
      } catch (err) {
        setError(err.message);
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
    setPage(1); // 검색 시 1페이지로 초기화
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

// 비밀번호 찾기
export function useFindPassword() {
  const [method, setMethod] = useState('email'); // 'email' or 'phone'
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
      // TODO: 백엔드에 임시 비밀번호 발급 API 구성 후 연결 (예: /api/user/reset-password)
      const targetValue = method === 'email' ? form.emailId : form.phone;
      console.log(`인증 요청: [${method}] ${targetValue}`);

      // 임시 시뮬레이션
      setTimeout(() => {
        setMessage(
          '인증이 완료되어 새로운 임시 비밀번호가 발급/전송 되었습니다.'
        );
        setLoading(false);
      }, 1000);
    } catch (err) {
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
