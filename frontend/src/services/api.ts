import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ?? 'http://localhost:5102/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, 
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
