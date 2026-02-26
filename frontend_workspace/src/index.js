import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initHttpClient } from './app/http/request';

initHttpClient({
  onLogout: () => {
    window.dispatchEvent(new Event("profile-updated"));
    window.location.href = '/login';
  },
}); // App.js에 작성하면 새로고침시 첫 api요청에서 auth정보가 빠짐

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
