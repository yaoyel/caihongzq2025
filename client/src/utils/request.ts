import axios from 'axios';
import { config } from '../config';

const request = axios.create({
  baseURL: `${config.apiHost}${config.apiPrefix}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 统一错误处理
    console.error('请求失败:', error);
    return Promise.reject(error);
  }
);

export default request;