// src/app/http/axiosInstance.js
import axios from 'axios';
import { getApiBaseUrl } from '../config/env';

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  withCredentials: false,
});
