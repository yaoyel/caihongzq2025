import { JsonController, Get, Param, Post, Body } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { DoubleEdgedScaleService } from '../services/doubleEdgedScale.service';

@JsonController('/double-edged-scale')
@Service()
export class DoubleEdgedScaleController {
    constructor(private doubleEdgedScaleService: DoubleEdgedScaleService) {}

    @Get('/double-edged/:id')
    @OpenAPI({ summary: '通过双刃剑ID获取相关量表信息' })
    async getByDoubleEdgedId(@Param('id') id: number) {
        return await this.doubleEdgedScaleService.findByDoubleEdgedId(id);
    }

    @Post('/answers')
    @OpenAPI({ summary: '保存双刃剑量表答案' })
    async saveAnswers(@Body() data: { answers: Array<{ userId: number; scaleId: number; score: number; doubleEdgedId: number }> }) {
        return await this.doubleEdgedScaleService.saveAnswers(data.answers);
    }
} 