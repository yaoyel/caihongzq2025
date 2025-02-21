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
        try {
            return await this.elementService.findAll();
        } catch (error) {
            logger.error({ error }, 'Failed to get elements');
            throw error;
        }
    }

    @Get('/:id')
    @OpenAPI({ summary: '获取单个元素' })
    async getOne(@Param('id') id: number) {
        try {
            return await this.elementService.findOne(id);
        } catch (error) {
            logger.error({ id, error }, 'Failed to get element');
            throw error;
        }
    }

    @Post()
    @Authorized()
    @OpenAPI({ summary: '创建元素' })
    async create(@Body() data: Partial<Element>) {
        try {
            return await this.elementService.create(data);
        } catch (error) {
            logger.error({ data, error }, 'Failed to create element');
            throw error;
        }
    }

    @Put('/:id')
    @Authorized()
    @OpenAPI({ summary: '更新元素' })
    async update(@Param('id') id: number, @Body() data: Partial<Element>) {
        try {
            return await this.elementService.update(id, data);
        } catch (error) {
            logger.error({ id, data, error }, 'Failed to update element');
            throw error;
        }
    }

    @Delete('/:id')
    @Authorized()
    @OpenAPI({ summary: '删除元素' })
    async delete(@Param('id') id: number) {
        try {
            await this.elementService.delete(id);
            return { success: true };
        } catch (error) {
            logger.error({ id, error }, 'Failed to delete element');
            throw error;
        }
    }
} 