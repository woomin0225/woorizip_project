import React from 'react';
import { useFindPassword } from '../hooks/useUserHooks';

export default function FindPassword() {
  const {
    method,
    setMethod,
    form,
    loading,
    message,
    handleChange,
    handleRequestNewPassword,
  } = useFindPassword();

  return (
    <div className="container mt-5 pb-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card bg-secondary shadow border-0">
            <div className="card-body px-lg-5 py-lg-5">
              <div className="text-center text-muted mb-4">
                <small>비밀번호 찾기 (임시 발급)</small>
              </div>

              <div className="d-flex justify-content-center mb-4">
                <div className="custom-control custom-radio mr-4">
                  <input
                    type="radio"
                    id="methodEmail"
                    className="custom-control-input"
                    checked={method === 'email'}
                    onChange={() => setMethod('email')}
                  />
                  <label className="custom-control-label" htmlFor="methodEmail">
                    이메일 인증
                  </label>
                </div>
                <div className="custom-control custom-radio">
                  <input
                    type="radio"
                    id="methodPhone"
                    className="custom-control-input"
                    checked={method === 'phone'}
                    onChange={() => setMethod('phone')}
                  />
                  <label className="custom-control-label" htmlFor="methodPhone">
                    휴대폰 인증
                  </label>
                </div>
              </div>

              <form onSubmit={handleRequestNewPassword}>
                {method === 'email' ? (
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
                        placeholder="가입한 이메일 입력"
                        value={form.emailId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group mb-3">
                    <div className="input-group input-group-alternative">
                      <div className="input-group-prepend">
                        <span className="input-group-text">
                          <i className="fa fa-mobile" />
                        </span>
                      </div>
                      <input
                        className="form-control"
                        name="phone"
                        type="text"
                        placeholder="가입한 휴대폰 번호 입력"
                        value={form.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary my-4"
                  >
                    {loading ? '요청 처리 중...' : '임시 비밀번호 발급 요청'}
                  </button>
                </div>
              </form>
              {message && (
                <div className="alert alert-success mt-3" role="alert">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
