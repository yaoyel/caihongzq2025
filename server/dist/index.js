"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const koa_1 = __importDefault(require("koa"));
const cors_1 = __importDefault(require("@koa/cors"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa_logger_1 = __importDefault(require("koa-logger"));
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const typeorm_1 = require("typeorm");
const data_source_1 = require("./data-source");
const logger_1 = require("./config/logger");
const wechat_1 = __importDefault(require("./routes/wechat"));
// 导入所有控制器
const element_controller_1 = require("./controllers/element.controller");
const question_controller_1 = require("./controllers/question.controller");
const scale_controller_1 = require("./controllers/scale.controller");
const user_controller_1 = require("./controllers/user.controller");
const chat_controller_1 = require("./controllers/chat.controller");
const report_controller_1 = require("./controllers/report.controller");
const error_handler_middleware_1 = require("./middlewares/error-handler.middleware");
const request_logger_middleware_1 = require("./middlewares/request-logger.middleware");
async function bootstrap() {
    try {
        // 1. 设置依赖注入容器
        (0, routing_controllers_1.useContainer)(typedi_1.Container);
        (0, typeorm_1.useContainer)(typedi_1.Container);
        // 2. 初始化数据库连接
        await (0, data_source_1.initializeDataSource)();
        // 3. 创建应用
        const app = new koa_1.default();
        // 4. 基础中间件
        app.use((0, cors_1.default)());
        app.use((0, koa_bodyparser_1.default)());
        app.use((0, koa_logger_1.default)());
        // 5. 注册请求日志中间件
        const requestLogger = typedi_1.Container.get(request_logger_middleware_1.RequestLoggerMiddleware);
        app.use(requestLogger.use.bind(requestLogger));
        // 6. 注册错误处理中间件
        const errorHandler = typedi_1.Container.get(error_handler_middleware_1.ErrorHandlerMiddleware);
        app.use(errorHandler.use.bind(errorHandler));
        // 6. 注入微信路由
        app.use(wechat_1.default.routes());
        app.use(wechat_1.default.allowedMethods());
        // 7. 配置路由控制器
        (0, routing_controllers_1.useKoaServer)(app, {
            controllers: [
                element_controller_1.ElementController,
                question_controller_1.QuestionController,
                scale_controller_1.ScaleController,
                user_controller_1.UserController,
                chat_controller_1.ChatController,
                report_controller_1.ReportController,
            ],
            middlewares: [],
            routePrefix: '/api',
            defaultErrorHandler: false,
            validation: true
        });
        // 7. 启动服务器
        const port = process.env.PORT || 80;
        const server = app.listen(port, () => {
            logger_1.logger.info(`Server running at http://localhost:${port}`);
        });
        // 8. 优雅关闭
        const gracefulShutdown = async () => {
            logger_1.logger.info('Received shutdown signal. Starting graceful shutdown...');
            server.close(() => {
                logger_1.logger.info('HTTP server closed.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        return { app, server };
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error('Failed to start server:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                ...(error.cause ? { cause: error.cause } : {})
            });
        }
        else {
            logger_1.logger.error('Failed to start server with unknown error:', error);
        }
        process.exit(1);
    }
}
bootstrap().catch((error) => {
    if (error instanceof Error) {
        logger_1.logger.error('Bootstrap failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
    else {
        logger_1.logger.error('Bootstrap failed with unknown error:', error);
    }
    process.exit(1);
});
exports.default = bootstrap;
