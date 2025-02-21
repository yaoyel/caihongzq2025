"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("./entity/User");
const Element_1 = require("./entity/Element");
const Scale_1 = require("./entity/Scale");
const ScaleAnswer_1 = require("./entity/ScaleAnswer");
const Question_1 = require("./entity/Question");
const QuestionAnswer_1 = require("./entity/QuestionAnswer");
const dotenv_1 = __importDefault(require("dotenv"));
const ChatMessage_1 = require("./entity/ChatMessage");
const ChatSession_1 = require("./entity/ChatSession");
const _1703664000000_CreateChatTables_1 = require("./migration/1703664000000-CreateChatTables");
// 加载环境变量
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'talent_assessment',
    synchronize: true,
    logging: true,
    entities: [
        User_1.User,
        Element_1.Element,
        Scale_1.Scale,
        ScaleAnswer_1.ScaleAnswer,
        Question_1.Question,
        QuestionAnswer_1.QuestionAnswer,
        ChatMessage_1.ChatMessage,
        ChatSession_1.ChatSession
    ],
    migrations: [
        _1703664000000_CreateChatTables_1.CreateChatTables1703664000000
    ],
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map