import { Context } from 'koa';
import { logger } from '../config/logger';

/**
 * 统一响应接口
 */
interface ResponseData<T = any> {
  code: number;      // HTTP状态码
  message: string;   // 响应消息
  data: T;          // 响应数据
}

/**
 * 自定义错误接口
 */
interface CustomError {
  status?: number;
  statusCode?: number;
  message?: string;
  stack?: string;
  name?: string;
  cause?: unknown;
  httpCode?: number;
}

/**
 * 获取响应消息
 * @param code HTTP状态码
 * @returns 对应的响应消息
 */
function getMessageByCode(code: number): string {
  const messageMap: Record<number, string> = {
    200: '操作成功',
    201: '创建成功',
    204: '删除成功',
    400: '请求参数错误',
    401: '未授权',
    403: '禁止访问',
    404: '资源不存在',
    500: '服务器内部错误',
  };
  return messageMap[code] || '未知状态';
}

/**
 * 扩展 Koa Context 类型
 */
declare module 'koa' {
  interface Context {
    success<T>(data: T, message?: string): void;
    fail(message: string, code?: number): void;
  }
}

/**
 * 统一响应中间件
 * @param ctx Koa上下文对象
 * @param next 下一个中间件函数
 */
export async function responseMiddleware(ctx: Context, next: (err?: any) => Promise<any>) {
  try {
    // 处理请求
    await next();

    // 获取原始响应数据
    const originalBody = ctx.body;
    const statusCode = ctx.status;

    // 如果状态码是204，不需要响应体
    if (statusCode === 204) {
      ctx.body = null;
      return;
    }

    console.log(originalBody);
    // 如果响应体是字符串类型，直接返回
    if (typeof originalBody === 'string') {
      
    console.log(2);
      ctx.body = originalBody;
      return;
    }

    console.log(3);
    // 构造统一响应格式
    const responseData: ResponseData = {
      code: statusCode,
      message: getMessageByCode(statusCode),
      data: originalBody
    };

    // 记录成功响应日志
    if (statusCode < 400) {
      logger.info('Request succeeded', {
        path: ctx.path,
        method: ctx.method,
        params: ctx.params,
        query: ctx.query,
        body: ctx.request.body,
        response: responseData
      });
    }

    // 设置响应体
    ctx.body = responseData;

  } catch (err: unknown) {
    // 转换错误类型
    const error = err as CustomError;
    
    // 获取错误状态码
    const errorCode = error.status || error.statusCode || error.httpCode|| 500;
    
    // 构造错误响应
    const errorResponse: ResponseData = {
      code: errorCode,
      message: error.message || getMessageByCode(errorCode),
      data: null
    };

    // 记录错误日志
    logger.error('Request failed', {
      path: ctx.path,
      method: ctx.method,
      params: ctx.params,
      query: ctx.query,
      body: ctx.request.body,
      error: {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'UnknownError',
        ...((err instanceof Error && err.cause) ? { cause: err.cause } : {})
      }
    });

    // 设置错误响应
    ctx.status = errorCode;
    ctx.body = errorResponse;
  }
}

export default responseMiddleware;
