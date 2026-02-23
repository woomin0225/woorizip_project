import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Signup from './features/member/pages/Signup';
import FindId from './features/member/pages/FindId';
import Login from './features/member/pages/Login';
import MemberList from './features/member/pages/MemberList';
import FindPassword from './features/member/pages/FindPassword';
import './assets/css/argon-design-system-react.min.css';

function App() {
  return (
    <BrowserRouter>
      {/* 화면 상단에 임시 네비게이션 메뉴 배치 (확인용) */}
      <nav
        style={{
          padding: '10px',
          background: '#eee',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <Link to="/login">로그인</Link>
        <Link to="/signup">회원가입</Link>
        <Link to="/find-id">아이디 찾기</Link>
        <Link to="/find-password">비밀번호 찾기</Link>
        <Link to="/admin/users">관리자 회원 목록</Link>
      </nav>

      {/* 라우트 설정 */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/find-id" element={<FindId />} />
        <Route path="/find-password" element={<FindPassword />} />
        <Route path="/admin/users" element={<MemberList />} />

        {/* 기본 경로 설정 */}
        <Route
          path="/"
          element={
            <div style={{ padding: '20px' }}>
              <h1>메인 페이지</h1>상단 메뉴를 클릭해서 각 페이지를 확인하세요.
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
