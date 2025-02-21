"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const routing_controllers_1 = require("routing-controllers");
const data_source_1 = require("./data-source");
const UserController_1 = require("./controllers/UserController");
const ElementController_1 = require("./controllers/ElementController");
const ScaleController_1 = require("./controllers/ScaleController");
const QuestionController_1 = require("./controllers/QuestionController");
const ChatController_1 = require("./controllers/ChatController");
// 初始化数据库连接
data_source_1.AppDataSource.initialize()
    .then(() => {
    // 创建 Koa 应用
    const app = (0, routing_controllers_1.createKoaServer)({
        cors: true,
        controllers: [
            UserController_1.UserController,
            ElementController_1.ElementController,
            ScaleController_1.ScaleController,
            QuestionController_1.QuestionController,
            ChatController_1.ChatController
        ],
        routePrefix: '/api'
    });
    // 启动服务器
    const port = 80;
    app.listen(port, () => {
        console.log(`服务器运行在 http://localhost:${port}`);
    });
})
    .catch((error) => console.log('数据库连接失败:', error));
//# sourceMappingURL=index.js.map