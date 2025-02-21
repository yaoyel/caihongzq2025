"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
// 确保logs目录存在
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir);
}
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        targets: [
            // 控制台美化输出
            {
                target: 'pino-pretty',
                level: 'info',
                options: {
                    colorize: true
                }
            },
            // 文件输出
            {
                target: 'pino/file',
                level: 'info',
                options: {
                    destination: path_1.default.join(logsDir, 'app.log'),
                    mkdir: true,
                    sync: false
                }
            }
        ]
    }
});
