import logo from './logo.png';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './assets/css/argon-design-system-react.min.css';
import AuthProvider from './app/providers/AuthProvider';
import AppRouter from './app/router';
import { initHttpClient } from "./app/http/request";

function App() {
  initHttpClient({
  onLogout: () => {
    // 토큰 정리 후 UI 갱신이 필요하면
    window.dispatchEvent(new Event("profile-updated"));
  },
});
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
