// @ts-nocheck
import axios from 'axios';

// 微信JS-SDK类型声明
declare global {
  interface Window {
    wx: {
      chooseWXPay: (config: {
        timestamp: string;
        nonceStr: string;
        package: string;
        signType: string;
        paySign: string;
        success: (res: any) => void;
        cancel: (res: any) => void;
        fail: (res: any) => void;
      }) => void;
    };
    WeixinJSBridge: {
      invoke: (
        method: string,
        config: {
          appId: string;
          timeStamp: string;
          nonceStr: string;
          package: string;
          signType: string;
          paySign: string;
        },
        callback: (res: any) => void
      ) => void;
    };
  }
}

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
    users: '/users',
    updateNickname: (userId: string) => `/users/updateNickname/${userId}`,
    majorScores: (userId: string) => `/majors/userscores/${userId}`,
    majorDetail: (code: string) => `/majors/${code}/detail`,
    majorBrief: (code: string) => `/majors/${code}/brief`,
    scalesByElements: (elementIds: string, userId: string) =>
      `/scales/by-elements-with-answers?elementIds=${elementIds}&userId=${userId}`,
    schoolDetail: (schoolId: string) => `/schools/${schoolId}`,
    wechatCallback: '/wechat/callback',
    wechatPay: '/pay/transactions_jsapi',
  },
};

// 添加一个辅助函数来设置请求头
export const getAuthHeaders = () => {
  const token = localStorage.getItem('new-token');
  if (!token) return {};

  console.log('使用 token:', token);
  return {
    Authorization: `Bearer ${token}`,
  };
};

// 这段代码应该移到一个实际使用的组件中，而不是在配置文件中执行
// 或者可以创建一个初始化函数，在需要时调用
export const checkUserAuth = () => {
  axios
    .get(getApiUrl('/users/me'), { headers: getAuthHeaders() })
    .then((response) => {
      console.log('用户信息响应:', response);
    })
    .catch((error) => {
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
export const getUserMajorScores = async (userId: string): Promise<MajorScoresResponse> => {
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

// 专业详情接口类型定义
interface MajorDetail {
  code: string;
  name: string;
  description: string;
  requirements: string;
  careerProspects: string;
  relatedMajors: string[];
}

interface MajorDetailResponse {
  success: boolean;
  message: string;
  data: MajorDetail;
}

/**
 * 获取专业详细信息
 * @param code 专业代码
 * @returns Promise<MajorDetailResponse>
 */
export const getMajorDetail = async (code: string): Promise<MajorDetailResponse> => {
  try {
    const response = await axios.get<MajorDetailResponse>(
      getApiUrl(api.endpoints.majorDetail(code)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取专业详情失败');
    }
    throw error;
  }
};

// 专业简要信息接口类型定义
interface MajorBrief {
  code: string;
  name: string;
  category: string;
  degree: string;
  duration: number;
  description: string;
}

interface MajorBriefResponse {
  success: boolean;
  message: string;
  data: MajorBrief;
}

/**
 * 获取专业简要信息
 * @param code 专业代码
 * @returns Promise<MajorBriefResponse>
 */
export const getMajorBrief = async (code: string): Promise<MajorBriefResponse> => {
  try {
    const response = await axios.get<MajorBriefResponse>(
      getApiUrl(api.endpoints.majorBrief(code)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取专业简要信息失败');
    }
    throw error;
  }
};

// 问卷内容和答案接口类型定义
interface ScaleAnswer {
  questionId: number;
  answer: string;
  score?: number;
}

interface ScaleWithAnswers {
  id: number;
  title: string;
  description: string;
  questions: Array<{
    id: number;
    content: string;
    type: string;
    options?: string[];
  }>;
  answers: ScaleAnswer[];
}

interface ScalesWithAnswersResponse {
  success: boolean;
  message: string;
  data: ScaleWithAnswers[];
}

/**
 * 获取指定元素ID的问卷内容和答案
 * @param elementIds 元素ID列表，用逗号分隔
 * @param userId 用户ID
 * @returns Promise<ScalesWithAnswersResponse>
 */
export const getScalesByElementsWithAnswers = async (
  elementIds: string,
  userId: string
): Promise<ScalesWithAnswersResponse> => {
  try {
    const response = await axios.get<ScalesWithAnswersResponse>(
      getApiUrl(api.endpoints.scalesByElements(elementIds, userId)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取问卷内容和答案失败');
    }
    throw error;
  }
};

// 院校信息接口类型定义
interface SchoolDetail {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  features: string[];
  admissionRequirements: string;
  website?: string;
}

interface SchoolDetailResponse {
  success: boolean;
  message: string;
  data: SchoolDetail;
}

/**
 * 获取院校详细信息
 * @param schoolId 院校ID
 * @returns Promise<SchoolDetailResponse>
 */
export const getSchoolDetail = async (schoolId: string): Promise<SchoolDetailResponse> => {
  try {
    const response = await axios.get<SchoolDetailResponse>(
      getApiUrl(api.endpoints.schoolDetail(schoolId)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取院校详情失败');
    }
    throw error;
  }
};

// 微信登录回调接口类型定义
interface WechatCallbackRequest {
  code: string;
  state?: string;
}

interface WechatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

interface WechatCallbackResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: WechatUserInfo;
    isNewUser: boolean;
  };
}

/**
 * 微信登录回调处理
 * @param code 微信授权码
 * @param state 可选的状态参数
 * @returns Promise<WechatCallbackResponse>
 */
export const handleWechatCallback = async (
  code: string,
  state?: string
): Promise<WechatCallbackResponse> => {
  try {
    // 构建查询参数
    const params = new URLSearchParams({ code });
    if (state) {
      params.append('state', state);
    }

    const response = await axios.get<WechatCallbackResponse>(
      `${getApiUrl(api.endpoints.wechatCallback)}?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '微信登录失败');
    }
    throw error;
  }
};

/**
 * 获取微信登录URL（用于重定向到微信授权页面）
 * @param redirectUri 回调地址
 * @param state 可选的状态参数
 * @returns 微信授权URL
 */
export const getWechatAuthUrl = (redirectUri: string, state?: string): string => {
  const appId = import.meta.env.VITE_WECHAT_APP_ID || '';
  const scope = 'snsapi_userinfo';
  const responseType = 'code';

  let url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}`;

  if (state) {
    url += `&state=${encodeURIComponent(state)}`;
  }

  url += '#wechat_redirect';

  return url;
};

// 微信支付接口类型定义
interface WechatPayRequest {
  openid: string; // 用户openid
  amount: number; // 支付金额（分）
}

interface WechatPayResponse {
  success: boolean;
  message: string;
  data: {
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
    outTradeNo: string;
  };
}

/**
 * 创建微信支付订单
 * @param openid 用户openid
 * @param amount 支付金额（分）
 * @returns Promise<WechatPayResponse>
 */
export const createWechatPayOrder = async (
  openid: string,
  amount: number
): Promise<WechatPayResponse> => {
  try {
    const params = new URLSearchParams({
      openid,
      amount: amount.toString(),
    });

    const response = await axios.get<WechatPayResponse>(
      `${getApiUrl(api.endpoints.wechatPay)}?${params.toString()}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '创建微信支付订单失败');
    }
    throw error;
  }
};

/**
 * 调用微信支付
 * @param openid 用户openid
 * @param amount 支付金额（分）
 * @returns Promise<boolean> 支付是否成功
 */
export const callWechatPay = async (openid: string, amount: number): Promise<boolean> => {
  try {
    console.log('openid', openid);
    console.log('amount', amount);
    // 创建支付订单
    const payResponse = await createWechatPayOrder(openid, amount);
    console.log('payResponse', payResponse);
    if (payResponse.code !== 200) {
      throw new Error(payResponse.message);
    }

    // 调用微信支付
    return new Promise((resolve, reject) => {
      console.log('payResponse', payResponse.data.data);
      if (typeof window !== 'undefined' && window.WeixinJSBridge && payResponse.data && payResponse.data.data) {
        console.log('调起支付', payResponse.data.data);
        window.WeixinJSBridge.invoke('getBrandWCPayRequest', {
          appId: import.meta.env.VITE_WECHAT_APP_ID || '',
          timeStamp: payResponse.data.data.timeStamp,
          nonceStr: payResponse.data.data.nonceStr,
          package: payResponse.data.data.package,
          signType: payResponse.data.data.signType,
          paySign: payResponse.data.data.paySign,
        }, function (res: any) {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            console.log('微信支付成功:', res);
            resolve(true);
          } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
            console.log('微信支付取消:', res);
            resolve(false);
          } else {
            console.error('微信支付失败:', res);
            reject(new Error('微信支付失败'));
          }
        });
      } else {
        reject(new Error('WeixinJSBridge未加载'));
      }
    });
  } catch (error) {
    console.error('调用微信支付失败:', error);
    throw error;
  }
};
