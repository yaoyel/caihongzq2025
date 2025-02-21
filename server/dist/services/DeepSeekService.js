"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1.default.config();
class DeepSeekService {
    constructor() {
        this.baseURL = 'https://api.deepseek.com/v1';
        this.apiKey = process.env.DEEPSEEK_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('DeepSeek API Key 未配置');
        }
    }
    async chat(message) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/chat/completions`, {
                model: 'deepseek-chat',
                messages: [
                    { role: 'user', content: message }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            console.error('DeepSeek API 调用失败:', error);
            throw error;
        }
    }
}
exports.DeepSeekService = DeepSeekService;
//# sourceMappingURL=DeepSeekService.js.map