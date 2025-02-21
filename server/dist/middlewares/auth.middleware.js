"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const koa_jwt_1 = __importDefault(require("koa-jwt"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.authMiddleware = (0, koa_jwt_1.default)({
    secret: process.env.JWT_SECRET || 'your-secret-key'
});
