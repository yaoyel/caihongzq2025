// 在浏览器环境中使用 window._env_ 或 import.meta.env 或直接使用 REACT_APP_ 变量
const API_HOST = window.location.hostname === 'localhost' ? 'http://localhost:80' : 'http://your-production-domain.com';

export const config = {
  apiHost: API_HOST,
  apiPrefix: '/api'
};

export const getApiUrl = (path: string) => {
  return `${config.apiHost}${config.apiPrefix}${path}`;
};

export const api = {
  baseURL: '/api',
  endpoints: {
    scales: '/scales',
    questions: '/questions',
    users: '/users',
  }
}; 