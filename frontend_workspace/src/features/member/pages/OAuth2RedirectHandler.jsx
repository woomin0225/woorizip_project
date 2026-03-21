import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { parseJwt } from '../../../app/providers/utils/jwt';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawToken = params.get('token');
    const error = params.get('error');

    if (rawToken) {
      let token = String(rawToken).trim();
      if (token.startsWith('Bearer ')) {
        token = token.slice('Bearer '.length).trim();
      }

      const payload = parseJwt(token);
      setTokens({
        accessToken: token,
        userId: payload?.sub || null,
        role: payload?.role || null,
      });
      alert('소셜 로그인 성공!');
      navigate('/', { replace: true });
    } else {
      alert(error || '소셜 로그인 처리에 실패했습니다.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, setTokens]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: '100vh' }}
    >
      <h3 className="text-info">소셜 로그인 처리 중입니다...</h3>
    </div>
  );
}
