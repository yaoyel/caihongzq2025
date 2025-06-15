import { JsonController, Get, Post, Put, Body, Param, QueryParam, Delete, Req, Ctx, NotFoundError, UnauthorizedError } from 'routing-controllers';
import { Scale168Service } from '../services/scale168.service';  
import { Service } from 'typedi';
interface SubmitAnswerDto {
  scaleId: number;
  optionId: number;
}

interface UpdateAnswerDto {
  optionId: number;
}

// 为Request定义接口
interface RequestWithUser extends Request {
  user: {
    id: number;
    [key: string]: any;
  }
}
 
@JsonController('/scale168/')
@Service()
export class Scale168Controller {
  constructor(private readonly scale168Service: Scale168Service) {}

  /**
   * 获取所有量表题目
   */ 
  @Get()
  async getAllScales() {
    const scales = await this.scale168Service.getAllScales();
    return   scales;  
  }

  /**
   * 获取单个量表题目
   * @param id 量表ID
   */
 
  @Get(':id')
  async getScaleById(@Param('id') id: number) {
    const scale = await this.scale168Service.getScaleById(id);
    if (!scale) {
      throw new NotFoundError('量表不存在')
    }
    return  scale;
     
  }

  /**
   * 获取量表题目及其选项
   * @param id 量表ID
   */ 
  @Get(':id/options')
  async getScaleWithOptions(@Param('id') id: number) {
    const { scale, options } = await this.scale168Service.getScaleWithOptions(id);
    if (!scale) {
      throw new NotFoundError('量表不存在')
    }
    return {
        scale, options  
    };
  }

  /**
   * 获取用户的量表答案
   * @param req 请求对象
   * @param scaleId 量表ID（可选）
   */ 
  @Get('answers/me')
  async getUserAnswers(@Ctx() ctx: { state: { user?: { userId: number } } }) {
    if (!ctx?.state?.user?.userId) {
      throw new UnauthorizedError('未获取到用户信息')
    }
    const userId = ctx!.state!.user!.userId;
    const answers = await this.scale168Service.getUserAnswers(userId); 
    return   answers ;
  }

  /**
   * 获取用户在168量表中的答案（只返回direction为168的量表的答案）
   * @param ctx 请求上下文
   * @param scaleId 量表ID（可选）
   */
  @Get('answers/168')
  async get168Answers(@Ctx() ctx: { state: { user?: { userId: number } } }, @QueryParam('scaleId') scaleId?: number) {
    if (!ctx?.state?.user?.userId) {
      throw new UnauthorizedError('未获取到用户信息')
    }
    const userId = ctx!.state!.user!.userId;
    const answers = await this.scale168Service.get168Answers(userId, scaleId);
    return  answers; 
  }

  /**
   * 提交用户对量表的回答
   * @param req 请求对象
   * @param body 提交答案的数据
   */
  
  @Post('answers')
  async submitAnswer(@Ctx() ctx: { state: { user?: { userId: number } } }, @Body() body: SubmitAnswerDto) {
    try {
      if (!ctx?.state?.user?.userId) {
        throw new UnauthorizedError('未获取到用户信息')
    }
      const userId = ctx!.state!.user!.userId;
      const answer = await this.scale168Service.submitAnswer(
        userId,
        body.scaleId,
        body.optionId
      );
      return answer; 
    } catch (error: any) {
      throw new Error(error.message || '提交答案失败') ;
    }
  }

  /**
   * 更新用户的量表答案
   * @param req 请求对象
   * @param answerId 答案ID
   * @param body 更新答案的数据
   */
 
  @Put('answers/:answerId')
  async updateAnswer(
    @Req() req: RequestWithUser,
    @Param('answerId') answerId: number,
    @Body() body: UpdateAnswerDto
  ) {
    try {
      // 通常应该先检查该答案是否属于当前用户
      const answer = await this.scale168Service.updateAnswer(answerId, body.optionId);
      return  answer;
      
    } catch (error: any) {
      throw new Error(error.message || '提交答案失败') ;
    }
  }

  /**
   * 删除用户的量表答案
   * @param req 请求对象
   * @param scaleId 量表ID
   */
 
  @Delete('answers/:scaleId')
  async deleteAnswer(@Req() req: RequestWithUser, @Param('scaleId') scaleId: number) {
    const userId = req.user.id;
    const result = await this.scale168Service.deleteAnswer(userId, scaleId);
    if (!result) {     
      throw new NotFoundError('答案不存在') 
    }
    return   result;
    
  }
}
