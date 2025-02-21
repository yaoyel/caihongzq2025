import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ChatService } from '../services/chat.service';

@JsonController('/chat')
@Service()
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Get('/sessions/user/:userId')
    @OpenAPI({ summary: '获取用户的聊天会话列表' })
    async getSessions(@Param('userId') userId: number) {
        return await this.chatService.getSessions(userId);
    }

    @Get('/sessions/shared/:shareCode')
    @OpenAPI({ summary: '获取共享的聊天会话' })
    async getSharedSession(@Param('shareCode') shareCode: string) {
        return await this.chatService.getSessionByShareCode(shareCode);
    }

    @Post('/messages')
    @OpenAPI({ summary: '发送消息' })
    async sendMessage(@Body() data: { sessionId: number; content: string; role: 'user' | 'assistant' }) {
        return await this.chatService.sendMessage(data.sessionId, data.content, data.role);
    }

    @Put('/sessions/:id/share')
    @OpenAPI({ summary: '分享聊天会话' })
    async shareSession(@Param('id') id: number) {
        return await this.chatService.shareSession(id);
    }

    @Put('/sessions/:id')
    @OpenAPI({ summary: '更新会话标题' })
    async updateSession(@Param('id') id: number, @Body() data: { title: string }) {
        return await this.chatService.updateSession(id, data.title);
    }

    @Post('/sessions')
    @OpenAPI({ summary: '创建聊天会话' })
    async createSession(@Body() data: { userId: number; title?: string }) {
        // 如果title未定义则使用空字符串作为默认值
        const sessionTitle = data.title || '';
        return await this.chatService.createSession(data.userId, sessionTitle);
    }

    @Get('/sessions/:sessionId/messages')
    @OpenAPI({ summary: '获取会话的消息列表' })
    async getSessionMessages(@Param('sessionId') sessionId: number) {
        return await this.chatService.getMessages(sessionId);
    }

    @Delete('/sessions/:id')
    @OpenAPI({ summary: '删除聊天会话' })
    async deleteSession(@Param('id') id: number) {
        await this.chatService.deleteSession(id);
        return { success: true };
    }
}