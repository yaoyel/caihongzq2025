"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const typedi_1 = require("typedi");
const typeorm_typedi_extensions_1 = require("typeorm-typedi-extensions");
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const axios_1 = __importDefault(require("axios"));
let UserService = class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async login(code) {
        try {
            // 调用微信接口获取openId
            const response = await axios_1.default.get(`https://api.weixin.qq.com/sns/jscode2session`, {
                params: {
                    appid: process.env.WECHAT_APPID,
                    secret: process.env.WECHAT_SECRET,
                    js_code: code,
                    grant_type: 'authorization_code'
                }
            });
            const { openid } = response.data;
            // 查找或创建用户
            let user = await this.userRepository.findOne({ where: { openid } });
            if (!user) {
                user = this.userRepository.create({
                    openid,
                    userType: 'child' // 设置默认值
                });
                await this.userRepository.save(user);
            }
            return user;
        }
        catch (error) {
            console.error('Login error:', error);
            throw new Error('登录失败');
        }
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('用户不存在');
        }
        return user;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, typedi_1.Service)(),
    __param(0, (0, typeorm_typedi_extensions_1.InjectRepository)(User_1.User)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], UserService);
