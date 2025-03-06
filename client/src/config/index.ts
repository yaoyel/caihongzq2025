import axios from 'axios';

// 添加这个类型声明来解决 import.meta.env 的类型错误
declare global {
  interface ImportMeta {
    env: Record<string, any>;
  }
}

// 从环境变量中获取API主机地址
const getApiHost = () => {
  // 优先使用环境变量
  if (import.meta.env && import.meta.env.API_HOST) {
    return import.meta.env.API_HOST;
  }
  
  // 如果没有环境变量，则根据当前域名判断
  return window.location.hostname === 'localhost' 
    ? 'http://caihongzq.com:3000' 
    : 'http://caihongzq.com:3000';
};

export const config = {
  apiHost: getApiHost(),
  apiPrefix: '/api'
};

export const getApiUrl = (path: string) => {
  // 确保path以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.apiHost}${config.apiPrefix}${normalizedPath}`;
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