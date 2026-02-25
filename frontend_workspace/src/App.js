import logo from './logo.png';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './assets/css/argon-design-system-react.min.css';
import AuthProvider from './app/providers/AuthProvider';
import AppRouter from './app/router';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
