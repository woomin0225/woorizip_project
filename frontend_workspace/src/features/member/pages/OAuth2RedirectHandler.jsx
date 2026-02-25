import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // TODO: 백엔드 로직에 따라 URL의 쿼리 파라미터 이름(?token= 등)을 맞춰야 함
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('accessToken', token);
      alert('소셜 로그인 성공!');
      navigate('/');
    } else {
      alert(error || '소셜 로그인 처리에 실패했습니다.');
      navigate('/login');
    }
  }, [navigate, location]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: '100vh' }}
    >
      <h3 className="text-info">소셜 로그인 처리 중입니다...</h3>
    </div>
  );
}
