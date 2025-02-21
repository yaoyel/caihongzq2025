import crypto from 'crypto';
import axios from 'axios';

// 生成随机字符串
export const generateRandomString = (length: number): string => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// 微信access_token接口返回数据类型
interface WechatAccessTokenResponse {
  access_token: string;
  expires_in: number;
}

// 获取微信access_token
let accessTokenCache: { token: string; expires: number } | null = null;

export const getAccessToken = async (): Promise<string> => {
  const now = Date.now();
  
  // 如果缓存的token还有效，直接返回
  if (accessTokenCache && now < accessTokenCache.expires) {
    return accessTokenCache.token;
  }

  try {
    const { WECHAT_APPID, WECHAT_SECRET } = process.env;
    
    if (!WECHAT_APPID || !WECHAT_SECRET) {
      throw new Error('微信配置缺失');
    }

    const response = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`
    );

    const data = response.data as WechatAccessTokenResponse;
    const { access_token, expires_in } = data;
    
    // 缓存token，设置过期时间提前5分钟
    accessTokenCache = {
      token: access_token,
      expires: now + (expires_in - 300) * 1000
    };

    return access_token;
  } catch (error) {
    console.error('获取access_token失败:', error);
    throw error;
  }
}; 