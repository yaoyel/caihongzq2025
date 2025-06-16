// @ts-nocheck
import axios from 'axios';


// 从环境变量中获取API主机地址
const getApiHost = () => {
  // 优先使用环境变量
  if (import.meta.env && import.meta.env.VITE_API_HOST) {
    return import.meta.env.VITE_API_HOST;
  }
  
  // 如果没有环境变量，则根据当前域名判断
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
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
    updateNickname: (userId: string) => `/users/updateNickname/${userId}`,
    majorScores: (userId: string) => `/majors/userscores/${userId}`,
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

// 修改用户昵称的接口类型定义
interface UpdateNicknameRequest {
    nickname: string;
}

interface UpdateNicknameResponse {
    success: boolean;
    message: string;
    data?: {
        nickname: string;
    };
}

/**
 * 修改用户昵称
 * @param userId 用户ID
 * @param nickname 新昵称
 * @returns Promise<UpdateNicknameResponse>
 */
export const updateUserNickname = async (
    userId: string,
    nickname: string
): Promise<UpdateNicknameResponse> => {
    try {
        const response = await axios.put<UpdateNicknameResponse>(
            getApiUrl(api.endpoints.updateNickname(userId)),
            { nickname },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || '修改昵称失败');
        }
        throw error;
    }
};

// 专业分析分数接口类型定义
interface MajorScore {
  majorId: string;
  majorName: string;
  score: number;
  rank: number;
}

interface MajorScoresResponse {
  success: boolean;
  message: string;
  data: MajorScore[];
}

/**
 * 获取用户专业分析分数排序列表
 * @param userId 用户ID
 * @returns Promise<MajorScoresResponse>
 */
export const getUserMajorScores = async (
  userId: string
): Promise<MajorScoresResponse> => {
  try {
    const response = await axios.get<MajorScoresResponse>(
      getApiUrl(api.endpoints.majorScores(userId)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取专业分析分数失败');
    }
    throw error;
  }
};