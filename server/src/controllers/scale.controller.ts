import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ScaleService } from '../services/scale.service';

@JsonController('/scales')
@Service()
export class ScaleController {
    constructor(private scaleService: ScaleService) {}

    @Get()
    @OpenAPI({ summary: '获取量表列表' })
    async getAll(
        @QueryParam('type') type?: 'like' | 'talent',
        @QueryParam('direction') direction?: 'positive' | 'negative'
    ) {
        return await this.scaleService.findAll(type, direction);
    }

    @Get('/:id')
    @OpenAPI({ summary: '获取量表详情' })
    async getOne(@Param('id') id: number) {
        return await this.scaleService.findOne(id);
    }

    @Post('/:id/answers')
    @OpenAPI({ summary: '提交量表答案' })
    async submitAnswer(
        @Param('id') scaleId: number,
        @Body() data: { userId: number; score: number }
    ) {
        return await this.scaleService.submitAnswer(scaleId, data);
    }

    @Get('/answers/user/:userId')
    @OpenAPI({ summary: '获取用户的量表答案' })
    async getUserAnswers(@Param('userId') userId: number) {
        return await this.scaleService.getUserAnswers(userId);
    }
} 