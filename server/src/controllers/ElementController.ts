import { JsonController, Get, Post, Put, Delete, Body, Param } from 'routing-controllers';
import { AppDataSource } from '../data-source';
import { Element } from '../entity/Element';

@JsonController('/elements')
export class ElementController {
  private elementRepository = AppDataSource.getRepository(Element);

  @Get()
  async getAll() {
    return this.elementRepository.find();
  }

  @Get('/:id')
  async getOne(@Param('id') id: number) {
    return this.elementRepository.findOne({ where: { id } });
  }

  @Post()
  async create(@Body() data: Partial<Element>) {
    const element = this.elementRepository.create(data);
    return this.elementRepository.save(element);
  }

  @Put('/:id')
  async update(@Param('id') id: number, @Body() data: Partial<Element>) {
    await this.elementRepository.update(id, data);
    return this.elementRepository.findOne({ where: { id } });
  }

  @Delete('/:id')
  async delete(@Param('id') id: number) {
    await this.elementRepository.delete(id);
    return { success: true };
  }
} 