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
const data_source_1 = require("./data-source");
const typeorm_1 = require("typeorm");
const wechat_1 = __importDefault(require("./routes/wechat"));
const logger_1 = require("./config/logger");
const logger_middleware_1 = require("./middlewares/logger.middleware");
const typeorm_2 = require("typeorm");
// 导入所有控制器
const element_controller_1 = require("./controllers/element.controller");
const question_controller_1 = require("./controllers/question.controller");
const scale_controller_1 = require("./controllers/scale.controller");
const user_controller_1 = require("./controllers/user.controller");
const chat_controller_1 = require("./controllers/chat.controller");
const report_controller_1 = require("./controllers/report.controller");
// 设置依赖注入
typedi_1.Container.reset();
(0, routing_controllers_1.useContainer)(typedi_1.Container);
(0, typeorm_1.useContainer)(typedi_1.Container);
async function bootstrap() {
    try {
        // 初始化数据库
        await data_source_1.AppDataSource.initialize();
        logger_1.logger.info('Database connection established');
        // 设置数据源
        typedi_1.Container.set(typeorm_2.DataSource, data_source_1.AppDataSource);
        // 创建应用
        const app = new koa_1.default();
        // 中间件
        app.use((0, cors_1.default)());
        app.use((0, koa_bodyparser_1.default)());
        app.use((0, koa_logger_1.default)());
        app.use(logger_middleware_1.loggerMiddleware);
        // 注入微信路由
        app.use(wechat_1.default.routes());
        app.use(wechat_1.default.allowedMethods());
        // 路由设置
        (0, routing_controllers_1.useKoaServer)(app, {
            controllers: [
                element_controller_1.ElementController,
                question_controller_1.QuestionController,
                scale_controller_1.ScaleController,
                user_controller_1.UserController,
                chat_controller_1.ChatController,
                report_controller_1.ReportController
            ],
            routePrefix: '/api',
            defaultErrorHandler: false,
            validation: true
        });
        // 启动服务器
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            logger_1.logger.info(`Server running at http://localhost:${port}`);
        });
        return app;
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.logger.error('Failed to start server. Full error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                ...(error.cause ? { cause: error.cause } : {}),
                code: error.code,
                detail: error.detail
            });
        }
        else {
            logger_1.logger.error('Failed to start server with unknown error:', error);
        }
        // 检查数据库连接状态
        if (data_source_1.AppDataSource.isInitialized) {
            logger_1.logger.info('Closing database connection...');
            await data_source_1.AppDataSource.destroy();
        }
        process.exit(1);
    }
}
bootstrap().catch((error) => {
    if (error instanceof Error) {
        logger_1.logger.error('Bootstrap failed. Error details:', {
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
