import dotenv from 'dotenv';

dotenv.config();

export const config = {
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