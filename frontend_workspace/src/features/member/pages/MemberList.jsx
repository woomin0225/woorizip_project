import React, { useEffect, useRef } from 'react';
import { useAdminUserList } from '../hooks/useUserHooks';
import {
  Button,
  Card,
  CardHeader,
  Table,
  Container,
  Row,
  Col,
  Input,
} from 'reactstrap';
import DemoNavbar from '../components/Navbars/DemoNavbar.js';
import SimpleFooter from '../components/Footers/SimpleFooter.js';

export default function AdminUserList() {
  const mainRef = useRef(null);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <DemoNavbar />
      <main ref={mainRef}>
        <section className="section section-shaped section-lg">
          <div className="shape shape-style-1 bg-gradient-info">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <Container className="pt-lg-7" fluid>
            <Row className="justify-content-center">
              <Col lg="10">
                <Card className="shadow">
                  <CardHeader className="border-0 d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">회원 관리 (관리자)</h3>
                    <form className="form-inline" onSubmit={handleSearch}>
                      <div className="form-group mb-0 mr-2">
                        <Input
                          type="select"
                          bsSize="sm"
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                        >
                          <option value="emailId">이메일</option>
                          <option value="name">이름</option>
                          <option value="phone">전화번호</option>
                        </Input>
                      </div>
                      <div className="form-group mb-0 mr-2">
                        <Input
                          bsSize="sm"
                          type="text"
                          placeholder="검색어 입력"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        color="info"
                        type="submit"
                        className="mb-0"
                      >
                        검색
                      </Button>
                    </form>
                  </CardHeader>
                  {loading && (
                    <div className="text-center py-4 text-info">
                      데이터를 불러오는 중입니다...
                    </div>
                  )}
                  {error && (
                    <div className="text-center py-4 text-danger">{error}</div>
                  )}
                  {!loading && !error && (
                    <div className="table-responsive">
                      <Table
                        className="align-items-center table-flush"
                        responsive
                      >
                        <thead className="thead-light">
                          <tr>
                            <th scope="col">유저번호</th>
                            <th scope="col">이메일</th>
                            <th scope="col">이름</th>
                            <th scope="col">전화번호</th>
                            <th scope="col">유형</th>
                            <th scope="col">권한</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="text-center py-4 text-muted"
                              >
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
                                  {u.type === 'LESSOR' ? '임대인' : '일반'}
                                </td>
                                <td>
                                  {u.role === 'ADMIN' ? '관리자' : '일반'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                  {!loading && !error && (
                    <div className="card-footer py-4">
                      <nav aria-label="...">
                        <ul className="pagination justify-content-end mb-0">
                          <li
                            className={`page-item ${page === 1 ? 'disabled' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={handlePrevPage}
                            >
                              <i className="fa fa-angle-left" />
                            </button>
                          </li>
                          <li className="page-item active">
                            <button className="page-link bg-info border-info">
                              {page}
                            </button>
                          </li>
                          <li
                            className={`page-item ${!hasMore ? 'disabled' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={handleNextPage}
                            >
                              <i className="fa fa-angle-right" />
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
      <SimpleFooter />
    </>
  );
}
