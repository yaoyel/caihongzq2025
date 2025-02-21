import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ChatService } from '../services/chat.service';
import { logger } from '../config/logger';

@JsonController('/chat')
@Service()
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Get('/sessions/:userId')
    @OpenAPI({ summary: '获取用户的聊天会话列表' })
    async getSessions(@Param('userId') userId: number) {
        try {
            return await this.chatService.getSessions(userId);
        } catch (error) {
            logger.error({ userId, error }, 'Failed to get chat sessions');
            throw error;
        }
    }

    @Get('/sessions/shared/:shareCode')
    @OpenAPI({ summary: '获取共享的聊天会话' })
    async getSharedSession(@Param('shareCode') shareCode: string) {
        try {
            return await this.chatService.getSessionByShareCode(shareCode);
        } catch (error) {
            logger.error({ shareCode, error }, 'Failed to get shared session');
            throw error;
        }
    }

    @Post('/messages')
    @OpenAPI({ summary: '发送消息' })
    async sendMessage(@Body() data: { sessionId: number; content: string; role: 'user' | 'assistant' }) {
        try {
            return await this.chatService.sendMessage(data.sessionId, data.content, data.role);
        } catch (error) {
            logger.error({ data, error }, 'Failed to send message');
            throw error;
        }
    }

    @Put('/sessions/:id/share')
    @OpenAPI({ summary: '分享聊天会话' })
    async shareSession(@Param('id') id: number) {
        try {
            return await this.chatService.shareSession(id);
        } catch (error) {
            logger.error({ id, error }, 'Failed to share session');
            throw error;
        }
    }

    @Put('/sessions/:id')
    @OpenAPI({ summary: '更新会话标题' })
    async updateSession(@Param('id') id: number, @Body() data: { title: string }) {
        try {
            return await this.chatService.updateSession(id, data.title);
        } catch (error) {
            logger.error({ id, data, error }, 'Failed to update session');
            throw error;
        }
    }

    @Delete('/sessions/:id')
    @OpenAPI({ summary: '删除聊天会话' })
    async deleteSession(@Param('id') id: number) {
        try {
            await this.chatService.deleteSession(id);
            return { success: true };
        } catch (error) {
            logger.error({ id, error }, 'Failed to delete session');
            throw error;
        }
    }
} 