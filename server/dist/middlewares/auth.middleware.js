"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const typedi_1 = require("typedi");
const jsonwebtoken_1 = require("jsonwebtoken");
const dotenv_1 = require("dotenv");
const routing_controllers_1 = require("routing-controllers");
(0, dotenv_1.config)();
let AuthMiddleware = class AuthMiddleware {
    async use(context, next) {
        const token = context.headers['authorization']?.split(' ')[1];
        if (!token) {
            throw new routing_controllers_1.UnauthorizedError('未提供认证令牌');
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || 'your-secret-key');
            context.state.user = decoded;
            return next();
        }
        catch (err) {
            throw new routing_controllers_1.UnauthorizedError('无效的认证令牌');
        }
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = __decorate([
    (0, typedi_1.Service)()
], AuthMiddleware);
