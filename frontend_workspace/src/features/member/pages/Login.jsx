import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useUserHooks';

export default function Login() {
  const navigate = useNavigate();
  const { form, loading, error, handleChange, handleLogin } = useLogin();

  return (
    <div className="container mt-5 pb-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card bg-secondary shadow border-0">
            <div className="card-body px-lg-5 py-lg-5">
              <div className="text-center text-muted mb-4">
                <small>로그인</small>
              </div>
              <form onSubmit={(e) => handleLogin(e, navigate)}>
                <div className="form-group mb-3">
                  <div className="input-group input-group-alternative">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <i className="fa fa-envelope" />
                      </span>
                    </div>
                    <input
                      className="form-control"
                      name="emailId"
                      type="email"
                      placeholder="이메일 입력"
                      value={form.emailId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-group input-group-alternative">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <i className="fa fa-lock" />
                      </span>
                    </div>
                    <input
                      className="form-control"
                      name="password"
                      type="password"
                      placeholder="비밀번호 입력"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-danger text-center mt-2 mb-2">
                    <small>{error}</small>
                  </div>
                )}
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary my-4"
                  >
                    {loading ? '로그인 처리 중...' : '로그인'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
