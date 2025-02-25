import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { DoubleEdgedAnswerService } from '../services/doubleEdgedAnswer.service';
import { CreateDoubleEdgedAnswerDto, UpdateDoubleEdgedAnswerDto, DoubleEdgedAnswerResponseDto } from '../dtos/DoubleEdgedAnswerDto';
// import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { Service } from 'typedi';
import { logger } from '../config/logger';

@JsonController('/double-edged-answers')
// @UseGuards(JwtAuthGuard)
@Service()
export class DoubleEdgedAnswerController {
  constructor(private readonly doubleEdgedAnswerService: DoubleEdgedAnswerService) {}

  @Get('/findByDoubleEdgedIdAndUserId')
  async findByDoubleEdgedIdAndUserId(
    @QueryParam('doubleEdgedId') doubleEdgedId: number,
    @QueryParam('userId') userId: number
  ): Promise<DoubleEdgedAnswerResponseDto[]> {
    logger.info('Finding answers by doubleEdgedId and userId', {
      doubleEdgedId,
      userId,
    });

    try {
      const answers = await this.doubleEdgedAnswerService.findByDoubleEdgedIdAndUserId(
        doubleEdgedId,
        userId
      );
      
      logger.info('Found answers', { count: answers.length });
      return answers;
    } catch (error) {
      logger.error('Error finding answers', {
        doubleEdgedId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  @Post()
  async create(@Body() createDto: CreateDoubleEdgedAnswerDto): Promise<DoubleEdgedAnswerResponseDto> {
    return await this.doubleEdgedAnswerService.create(createDto);
  }

  @Get()
  async findAll(): Promise<DoubleEdgedAnswerResponseDto[]> {
    return await this.doubleEdgedAnswerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<DoubleEdgedAnswerResponseDto> {
    const answer = await this.doubleEdgedAnswerService.findOne(id);
    if (!answer) {
      throw new Error('双刃剑问答不存在');
    }
    return answer;
  }

  @Get('/findByUserId')
  async findByUserId(@QueryParam('userId') userId: number): Promise<DoubleEdgedAnswerResponseDto[]> {
    return await this.doubleEdgedAnswerService.findByUserId(userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateDoubleEdgedAnswerDto
  ): Promise<DoubleEdgedAnswerResponseDto> {
    const answer = await this.doubleEdgedAnswerService.update(id, updateDto);
    if (!answer) {
      throw new Error('双刃剑问答不存在');
    }
    return answer;
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    await this.doubleEdgedAnswerService.remove(id);
  }
}