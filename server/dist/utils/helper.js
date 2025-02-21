"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessToken = exports.generateRandomString = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
// 生成随机字符串
const generateRandomString = (length) => {
    return crypto_1.default.randomBytes(length).toString('hex').slice(0, length);
};
exports.generateRandomString = generateRandomString;
// 获取微信access_token
let accessTokenCache = null;
const getAccessToken = async () => {
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
        const response = await axios_1.default.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`);
        const data = response.data;
        const { access_token, expires_in } = data;
        // 缓存token，设置过期时间提前5分钟
        accessTokenCache = {
            token: access_token,
            expires: now + (expires_in - 300) * 1000
        };
        return access_token;
    }
    catch (error) {
        console.error('获取access_token失败:', error);
        throw error;
    }
};
exports.getAccessToken = getAccessToken;
