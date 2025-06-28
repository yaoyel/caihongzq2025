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
  apiPrefix: '/api',
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
    // 专业收藏接口
    majorIntention: (majorCode: string) => `/majors/intention/${majorCode}`,
    // 查询收藏列表接口
    majorIntentions: '/majors/intentions',
  },
};

// 专业收藏接口类型定义
interface MajorIntentionResponse {
  success: boolean;
  message: string;
  data?: {
    majorCode: string;
    isIntention: boolean;
  };
}

// 添加一个辅助函数来设置请求头
export const getAuthHeaders = () => {
  const token = localStorage.getItem('new-token');
  if (!token) return {};

  console.log('使用 token:', token);
  return {
    Authorization: `Bearer ${token}`,
  };
};
/**
 * 收藏/取消收藏专业
 * @param majorCode 专业代码
 * @returns Promise<MajorIntentionResponse>
 */
export const toggleMajorIntention = async (majorCode: string): Promise<MajorIntentionResponse> => {
  try {
    const response = await axios.post<MajorIntentionResponse>(
      getApiUrl(api.endpoints.majorIntention(majorCode)),
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '收藏专业操作失败');
    }
    throw error;
  }
};

/**
 * 取消收藏专业
 * @param majorCode 专业代码
 * @returns Promise<MajorIntentionResponse>
 */
export const cancelMajorIntention = async (majorCode: string): Promise<MajorIntentionResponse> => {
  try {
    const response = await axios.delete<MajorIntentionResponse>(
      getApiUrl(api.endpoints.majorIntention(majorCode)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '取消收藏专业失败');
    }
    throw error;
  }
};

// 收藏列表接口类型定义
interface MajorIntentionItem {
  majorCode: string;
  majorName: string;
  isIntention: boolean;
  createdAt: string;
}

interface MajorIntentionsResponse {
  success: boolean;
  message: string;
  data: MajorIntentionItem[];
}

/**
 * 查询用户收藏的专业列表
 * @returns Promise<MajorIntentionsResponse>
 */
export const getMajorIntentions = async (): Promise<MajorIntentionsResponse> => {
  try {
    const response = await axios.get<MajorIntentionsResponse>(
      getApiUrl(api.endpoints.majorIntentions),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取收藏专业列表失败');
    }
    throw error;
  }
};
