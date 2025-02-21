import 'reflect-metadata';
import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import { useKoaServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { AppDataSource } from './data-source';
import { useContainer as typeormUseContainer, getConnectionManager } from 'typeorm';
import wechatRouter from './routes/wechat';
import { logger } from './config/logger';

// 导入所有控制器
import { ElementController } from './controllers/element.controller';
import { QuestionController } from './controllers/question.controller';
import { ScaleController } from './controllers/scale.controller';
import { UserController } from './controllers/user.controller';
import { ChatController } from './controllers/chat.controller';
import { ReportController } from './controllers/report.controller';

// 设置依赖注入
Container.reset();  // 重置容器
useContainer(Container);
typeormUseContainer(Container);

async function bootstrap() {
    try {
        // 初始化数据库
        await AppDataSource.initialize();
        logger.info('Database connection established');

        // 设置连接到容器
        const connectionManager = getConnectionManager();
        if (!connectionManager.has('default')) {
            connectionManager.create({
                name: 'default',
                ...AppDataSource.options
            });
        }
        const connection = connectionManager.get('default');
        if (!connection.isConnected) {
            await connection.connect();
        }

        // 创建应用
        const app = new Koa();

        // 中间件
        app.use(cors());
        app.use(bodyParser());
        app.use(koaLogger());

        // 注入微信路由
        app.use(wechatRouter.routes());
        app.use(wechatRouter.allowedMethods());

        // 路由设置
        useKoaServer(app, {
            controllers: [
                ElementController,
                QuestionController,
                ScaleController,
                UserController,
                ChatController,
                ReportController
            ],
            routePrefix: '/api',
            defaultErrorHandler: false,
            validation: true
        });

        // 启动服务器
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            logger.info(`Server running at http://localhost:${port}`);
        });

        return app;
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error('Failed to start server. Full error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                ...(error.cause ? { cause: error.cause } : {}),
                code: (error as any).code,
                detail: (error as any).detail
            });
        } else {
            logger.error('Failed to start server with unknown error:', error);
        }
        
        // 检查数据库连接状态
        if (AppDataSource.isInitialized) {
            logger.info('Closing database connection...');
            await AppDataSource.destroy();
        }
        
        process.exit(1);
    }
}

bootstrap().catch((error: unknown) => {
    if (error instanceof Error) {
        logger.error('Bootstrap failed. Error details:', {
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