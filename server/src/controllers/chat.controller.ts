import { JsonController, Get, Post, Put, Delete, Body, Param, Res, QueryParam, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ChatService } from '../services/chat.service';
import { Context } from 'koa';
import jwt from 'jsonwebtoken'; 
import { ChatSession } from '../entities/ChatSession';
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
    @OpenAPI({ summary: '发送消息并处理AI响应' })
    async sendMessage(@Body() data: { 
        sessionId: number; 
        content: string; 
        role: 'user' | 'assistant';
        userId: number;
        system_prompt?: string; // 添加 userId 参数
    }) {
        // 调用 processMessage 来处理消息并获取 AI 响应
        const result = await this.chatService.processMessage({
            userId: data.userId,
            sessionId: data.sessionId,
            content: data.content,
            role: data.role
        });
        
        return result; // 这将返回 { userMessage, aiMessage } 对象
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
    async createSession(@Body() data: { userId: number; title?: string, can_delete?: boolean }) {
        // 如果title未定义则使用空字符串作为默认值
        const sessionTitle = data.title || '';
        return await this.chatService.createSession(data.userId, sessionTitle, data.can_delete || false);
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

    @Get('/stream') 
    async stream(@Res() ctx: Context, @QueryParam('token') token: string) {
        // 添加token验证
        if (!token || !jwt.verify(token, process.env.JWT_SECRET!)) {
            ctx.status = 401;
            return;
        }

        ctx.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        
        ctx.status = 200;
        ctx.flushHeaders();

        const listener = (data: any) => {
            // 修改：添加事件类型和确保正确的SSE格式
            ctx.res.write(`event: message-update\ndata: ${JSON.stringify(data)}\n\n`);
        };

        this.chatService.eventEmitter.on('message-update', listener);

        // 发送初始连接成功消息
        ctx.res.write('event: connected\ndata: {"status":"connected"}\n\n');
        
        ctx.req.on('close', () => {
            this.chatService.eventEmitter.off('message-update', listener);
            ctx.res.end();
        });

        return new Promise((resolve) => {
            ctx.req.on('close', resolve);
        });
    }

    @Delete('/messages/:id')
    async deleteMessage(@Param('id') id: number) {
        try {
            
            await this.chatService.deleteMessage(id);
            
           return { message: '消息删除成功' };
        } catch (error) {
            return { error: '删除消息失败' }; 
        }
    }

    @Get('/sessions/findByTitle')
    async findSessionByTitle(
        @QueryParam('title') title: string,
        @QueryParam('userId') userId: string
    ): Promise<ChatSession | null> {
        try {
            const session = await this.chatService.findSessionByTitle(title, userId);
            if (!session) {
                return null;
            }
            return session;
        } catch (error) {
            throw new Error('获取聊天会话失败');
        }
    }
}