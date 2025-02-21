"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-reasoner',
        baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1',
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2000'),
        topP: parseFloat(process.env.DEEPSEEK_TOP_P || '0.7'),
        presencePenalty: parseFloat(process.env.DEEPSEEK_PRESENCE_PENALTY || '0'),
        frequencyPenalty: parseFloat(process.env.DEEPSEEK_FREQUENCY_PENALTY || '0')
    }
};
