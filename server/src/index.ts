import 'reflect-metadata';
import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import { useKoaServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as typeormUseContainer } from 'typeorm';
import { initializeDataSource } from './data-source';
import { logger } from './config/logger';
import wechatRouter from './routes/wechat';
import { DataSource } from 'typeorm';

// 导入所有控制器
import { ElementController } from './controllers/element.controller';
import { QuestionController } from './controllers/question.controller';
import { ScaleController } from './controllers/scale.controller';
import { UserController } from './controllers/user.controller';
import { ChatController } from './controllers/chat.controller';
import { ReportController } from './controllers/report.controller';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';  
import { jwtMiddleware } from './middlewares/jwt.middleware';
import { DoubleEdgedInfoController } from './controllers/doubleEdgedInfo.controller';
import { DoubleEdgedScaleController } from './controllers/doubleEdgedScale.controller';
import { DoubleEdgedAnswerController } from './controllers/doubleEdgedAnswer.controller';
import { UserAnalysisController } from './controllers/userAnalysis.controller';
async function bootstrap() {
    try {
        // 1. 设置依赖注入容器
        useContainer(Container);
        typeormUseContainer(Container);

        // 2. 初始化数据库连接
        await initializeDataSource();

        // 3. 创建应用
        const app = new Koa();

        // 4. 基础中间件
        app.use(cors());
        app.use(bodyParser({
          enableTypes: ['json', 'form', 'text'],
          extendTypes: {
            text: ['text/xml', 'application/xml']
          },
          onerror: (err: Error, ctx: Koa.Context) => {
            ctx.throw(422, '请求体解析失败');
          }
        }));
        app.use(jwtMiddleware);
        app.use(koaLogger()); 
 
        // 6. 注册错误处理中间件  
        app.use(requestLoggerMiddleware);
        app.use(errorHandlerMiddleware);
        // 6. 注入微信路由
        app.use(wechatRouter.routes());
    
        app.use(wechatRouter.allowedMethods());

        // 7. 配置路由控制器
        useKoaServer(app, {
            controllers: [
                DoubleEdgedAnswerController,
                ElementController,
                QuestionController,
                ScaleController,
                UserController,
                ChatController,
                ReportController, 
                DoubleEdgedInfoController,
                DoubleEdgedScaleController,
                UserAnalysisController
            ],
            middlewares: [],
            routePrefix: '/api',
            defaultErrorHandler: false,
            validation: true
        });

        // 7. 启动服务器
        const port = process.env.PORT || 80;
        const server = app.listen(port, () => {
            logger.info(`Server running at http://localhost:${port}`);
        });

        // 8. 优雅关闭
        const gracefulShutdown = async () => {
            logger.info('Received shutdown signal. Starting graceful shutdown...');
            
            server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        return { app, server };
    } catch (error) {
        if (error instanceof Error) {
            logger.error('Failed to start server:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                ...(error.cause ? { cause: error.cause } : {})
            });
        } else {
            logger.error('Failed to start server with unknown error:', error);
        }
        process.exit(1);
    }
}

bootstrap().catch((error) => {
    if (error instanceof Error) {
        logger.error('Bootstrap failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    } else {
        logger.error('Bootstrap failed with unknown error:', error);
    }
    process.exit(1);
});
export default bootstrap;
