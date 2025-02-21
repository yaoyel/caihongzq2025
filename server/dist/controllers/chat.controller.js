"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_service_1 = require("../services/chat.service");
class ChatController {
    constructor() {
        this.chatService = new chat_service_1.ChatService();
    }
    async getHistory(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const history = await this.chatService.getHistory(userId);
            res.json(history);
        }
        catch (error) {
            console.error('获取聊天历史失败:', error);
            res.status(500).json({ error: '获取聊天历史失败' });
        }
    }
    async sendMessage(req, res) {
        try {
            const { userId, content } = req.body;
            if (!content || !userId) {
                return res.status(400).json({ error: '缺少必要参数' });
            }
            const response = await this.chatService.sendMessage(userId, content);
            res.json(response);
        }
        catch (error) {
            console.error('发送消息失败:', error);
            res.status(500).json({ error: '发送消息失败' });
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map