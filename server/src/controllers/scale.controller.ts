import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, QueryParams, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ScaleService } from '../services/scale.service';

@JsonController('/scales')
@Service()
export class ScaleController {
    constructor(private scaleService: ScaleService) {}

    @Get('/by-elements')
    @OpenAPI({ summary: '通过元素ID列表获取量表' })
    async getByElements(@QueryParam('ids') elementIds: string) {
        if (!elementIds || elementIds.trim() === '') {
            return [];
        }
        try {
            // 移除所有空格，然后按逗号分割
            const elementIdArray = elementIds
                .trim()
                .split(',')
                .map(Number)
                .filter(id => !isNaN(id) && id > 0);

            if (elementIdArray.length === 0) {
                return [];
            }
            return await this.scaleService.findByElements(elementIdArray);
        } catch (error) {
            console.error('Error in getByElements:', error);
            return [];
        }
    }
    
    
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

    @Get('/answers/user/:userId/summary')
    @OpenAPI({ summary: '获取用户量表答题汇总' })
    async getUserAnswersSummary(@Param('userId') userId: number) {
        return await this.scaleService.getUserAnswersSummary(userId);
    }
   
}