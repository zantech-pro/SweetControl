import axios from 'axios';
import { env } from './env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

