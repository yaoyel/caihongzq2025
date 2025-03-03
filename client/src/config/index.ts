import axios from 'axios';

// 在浏览器环境中使用 window._env_ 或 import.meta.env 或直接使用 REACT_APP_ 变量
const API_HOST = window.location.hostname === 'localhost' ? 'http://caihongzq.com:3000' : 'http://caihongzq.com:3000';

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

// 添加一个辅助函数来设置请求头
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return {};
    
    console.log('使用 token:', token);
    return {
        'Authorization': `Bearer ${token}`
    };
};

// 这段代码应该移到一个实际使用的组件中，而不是在配置文件中执行
// 或者可以创建一个初始化函数，在需要时调用
export const checkUserAuth = () => {
    axios.get(getApiUrl('/users/me'), { headers: getAuthHeaders() })
        .then(response => {
            console.log('用户信息响应:', response);
        })
        .catch(error => {
            console.error('获取用户信息失败:', error);
        });
}; 