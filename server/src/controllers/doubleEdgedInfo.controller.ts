import { JsonController, Get, Param, QueryParam, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { DoubleEdgedInfoService } from '../services/doubleEdgedInfo.service';

@JsonController('/double-edged-info')
@Service()
export class DoubleEdgedInfoController {
    constructor(private doubleEdgedInfoService: DoubleEdgedInfoService) {}

    @Get('/all') 
    @OpenAPI({ summary: '获取所有双刃剑详细信息' })
    async getAll() {
        return await this.doubleEdgedInfoService.findAll();
    }

    @Get('/:id') 
    @OpenAPI({ summary: '通过ID获取双刃剑详细信息' })
    async getById(@Param('id') id: number) {
        return await this.doubleEdgedInfoService.findOne(id);
    }

    @Get() 
    @OpenAPI({ summary: '通过喜好元素ID和天赋元素ID获取双刃剑详细信息' })
    async getByElementIds(
        @QueryParam('likeElementId') likeElementId: number,
        @QueryParam('talentElementId') talentElementId: number
    ) {
        if (!likeElementId || !talentElementId) {
            throw new Error('必须同时提供喜好元素ID和天赋元素ID');
        }
        return await this.doubleEdgedInfoService.findByElementIds(likeElementId, talentElementId);
    }

    @Get('/like-element/:id') 
    @OpenAPI({ summary: '通过喜好元素ID获取相关的双刃剑详细信息列表' })
    async getByLikeElementId(@Param('id') likeElementId: number) {
        return await this.doubleEdgedInfoService.findByLikeElementId(likeElementId);
    }

    @Get('/talent-element/:id') 
    @OpenAPI({ summary: '通过天赋元素ID获取相关的双刃剑详细信息列表' })
    async getByTalentElementId(@Param('id') talentElementId: number) {
        return await this.doubleEdgedInfoService.findByTalentElementId(talentElementId);
    }
} 