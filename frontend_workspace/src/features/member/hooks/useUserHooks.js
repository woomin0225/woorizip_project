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
    birthDate: '', // yyyy-MM-dd
    type: 'USER', // 'USER' or 'LESSOR'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, navigate) => {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: API 파일 완성 시 fetch 연동 (예: const res = await signupApi(form);)
      // fetch('/api/users/signup', { method: 'POST', body: JSON.stringify(form) })
      console.log('가입 폼 데이터:', form);
      alert('회원가입 요청이 처리되었습니다. (API 연동 대기)');
      navigate('/login');
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, error, handleChange, handleSubmit };
}

// 아이디 찾기
export function useFindId() {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [foundId, setFoundId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFindId = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFoundId('');

    try {
      // TODO: API 연동 시 백엔드에서 emailId를 찾아오도록 구성
      console.log('아이디 찾기 데이터:', form);
      // 임시 결과
      setFoundId('test@example.com (API 미연동)');
    } catch (err) {
      alert('아이디를 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return { form, foundId, loading, handleChange, handleFindId };
}

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
      // API 통신 예시 (백엔드 EndpointPolicy 기준 /auth/login)
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('아이디 또는 비밀번호를 확인해주세요.');

      const data = await res.json();

      // JWT 토큰 저장 (응답 구조에 따라 token 필드명은 변경 필요)
      const token = data.token || data.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
      }

      alert('로그인되었습니다.');
      navigate('/');
    } catch (err) {
      setError(err.message);
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
