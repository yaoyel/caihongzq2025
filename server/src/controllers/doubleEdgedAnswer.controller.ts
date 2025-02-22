import { JsonController, Get, Post, Put, Delete, Body, Param  } from 'routing-controllers';
import { DoubleEdgedAnswerService } from '../services/doubleEdgedAnswer.service';
import { CreateDoubleEdgedAnswerDto, UpdateDoubleEdgedAnswerDto, DoubleEdgedAnswerResponseDto } from '../dtos/DoubleEdgedAnswerDto';
// import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

@JsonController('double-edged-answers')
// @UseGuards(JwtAuthGuard)
export class DoubleEdgedAnswerController {
  constructor(private readonly doubleEdgedAnswerService: DoubleEdgedAnswerService) {}

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

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: number): Promise<DoubleEdgedAnswerResponseDto[]> {
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