import React from 'react';
import { useAdminUserList } from '../hooks/useUserHooks';

export default function AdminUserList() {
  const {
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
  } = useAdminUserList();

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <div className="col">
          <div className="card shadow">
            <div className="card-header border-0 d-flex justify-content-between align-items-center">
              <h3 className="mb-0">회원 관리 (관리자)</h3>
              <form className="form-inline" onSubmit={handleSearch}>
                <div className="form-group mb-0 mr-2">
                  <select
                    className="form-control form-control-sm"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="emailId">이메일</option>
                    <option value="name">이름</option>
                    <option value="phone">전화번호</option>
                  </select>
                </div>
                <div className="form-group mb-0 mr-2">
                  <input
                    className="form-control form-control-sm"
                    type="text"
                    placeholder="검색어 입력"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-primary mb-0">
                  검색
                </button>
              </form>
            </div>

            {loading && (
              <div className="text-center py-4 text-primary">
                데이터를 불러오는 중입니다...
              </div>
            )}
            {error && (
              <div className="text-center py-4 text-danger">{error}</div>
            )}

            {!loading && !error && (
              <div className="table-responsive">
                <table className="table align-items-center table-flush">
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">유저번호(userNo)</th>
                      <th scope="col">이메일 아이디</th>
                      <th scope="col">이름</th>
                      <th scope="col">전화번호</th>
                      <th scope="col">유형</th>
                      <th scope="col">권한</th>
                      <th scope="col">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          조회된 회원이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.userNo}>
                          <td>{u.userNo}</td>
                          <td>{u.emailId}</td>
                          <td>{u.name}</td>
                          <td>{u.phone}</td>
                          <td>
                            <span className="badge badge-dot mr-4">
                              <i
                                className={
                                  u.type === 'LESSOR'
                                    ? 'bg-warning'
                                    : 'bg-success'
                                }
                              />
                              {u.type === 'LESSOR' ? '임대인' : '일반'}
                            </span>
                          </td>
                          <td>{u.role === 'ADMIN' ? '관리자' : '일반'}</td>
                          <td>
                            {u.createdAt ? u.createdAt.substring(0, 10) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div className="card-footer py-4">
                <nav aria-label="...">
                  <ul className="pagination justify-content-end mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={handlePrevPage}>
                        <i className="fa fa-angle-left" />
                        <span className="sr-only">이전</span>
                      </button>
                    </li>
                    <li className="page-item active">
                      <button className="page-link">{page}</button>
                    </li>
                    <li className={`page-item ${!hasMore ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={handleNextPage}>
                        <i className="fa fa-angle-right" />
                        <span className="sr-only">다음</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
