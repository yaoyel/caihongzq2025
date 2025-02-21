import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ElementService } from '../services/element.service';
import { logger } from '../config/logger';
import { Element } from '../entities/Element';

@JsonController('/elements')
@Service()
export class ElementController {
    constructor(private elementService: ElementService) {}

    @Get()
    @OpenAPI({ summary: '获取所有元素' })
    async getAll() {
        return await this.elementService.findAll();
    }

    @Get('/:id')
    @OpenAPI({ summary: '获取单个元素' })
    async getOne(@Param('id') id: number) {
        return await this.elementService.findOne(id);
    }

    @Post()
    @Authorized()
    @OpenAPI({ summary: '创建元素' })
    async create(@Body() data: Partial<Element>) {
        return await this.elementService.create(data);
    }

    @Put('/:id')
    @Authorized()
    @OpenAPI({ summary: '更新元素' })
    async update(@Param('id') id: number, @Body() data: Partial<Element>) {
        return await this.elementService.update(id, data);
    }

    @Delete('/:id')
    @Authorized()
    @OpenAPI({ summary: '删除元素' })
    async delete(@Param('id') id: number) {
        await this.elementService.delete(id);
        return { success: true };
    }
} 