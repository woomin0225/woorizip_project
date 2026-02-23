import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from '../hooks/useUserHooks';

export default function Signup() {
  const navigate = useNavigate();
  const { form, loading, error, handleChange, handleSubmit } = useSignup();

  return (
    <div className="container mt-5 pb-5">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-md-9">
          <div className="card bg-secondary shadow border-0">
            <div className="card-body px-lg-5 py-lg-5">
              <div className="text-center text-muted mb-4">
                <small>회원가입</small>
              </div>
              <form onSubmit={(e) => handleSubmit(e, navigate)}>
                <div className="form-group">
                  <label className="form-control-label">계정유형</label>
                  <select
                    className="form-control form-control-alternative"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="USER">일반 사용자</option>
                    <option value="LESSOR">임대인</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-control-label">이메일 아이디</label>
                  <input
                    className="form-control form-control-alternative"
                    name="emailId"
                    type="email"
                    value={form.emailId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">비밀번호</label>
                      <input
                        className="form-control form-control-alternative"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">
                        비밀번호 확인
                      </label>
                      <input
                        className="form-control form-control-alternative"
                        name="passwordConfirm"
                        type="password"
                        value={form.passwordConfirm}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">이름</label>
                      <input
                        className="form-control form-control-alternative"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-control-label">전화번호</label>
                      <input
                        className="form-control form-control-alternative"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-control-label d-block">성별</label>
                  <div className="custom-control custom-radio custom-control-inline mr-3">
                    <input
                      type="radio"
                      id="genderM"
                      name="gender"
                      className="custom-control-input"
                      value="M"
                      checked={form.gender === 'M'}
                      onChange={handleChange}
                    />
                    <label className="custom-control-label" htmlFor="genderM">
                      남
                    </label>
                  </div>
                  <div className="custom-control custom-radio custom-control-inline">
                    <input
                      type="radio"
                      id="genderF"
                      name="gender"
                      className="custom-control-input"
                      value="F"
                      checked={form.gender === 'F'}
                      onChange={handleChange}
                    />
                    <label className="custom-control-label" htmlFor="genderF">
                      여
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-control-label">생년월일</label>
                  <input
                    className="form-control form-control-alternative"
                    name="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={handleChange}
                  />
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
                    className="btn btn-primary mt-4"
                  >
                    {loading ? '가입 중...' : '가입하기'}
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
