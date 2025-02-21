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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementService = void 0;
const typedi_1 = require("typedi");
const typeorm_typedi_extensions_1 = require("typeorm-typedi-extensions");
const typeorm_1 = require("typeorm");
const Element_1 = require("../entities/Element");
let ElementService = class ElementService {
    elementRepository;
    constructor(elementRepository) {
        this.elementRepository = elementRepository;
    }
    async findAll() {
        return this.elementRepository.find();
    }
    async findOne(id) {
        return this.elementRepository.findOne({ where: { id } });
    }
    async create(data) {
        const element = this.elementRepository.create(data);
        return this.elementRepository.save(element);
    }
    async update(id, data) {
        await this.elementRepository.update(id, data);
        return this.findOne(id);
    }
    async delete(id) {
        await this.elementRepository.delete(id);
    }
};
exports.ElementService = ElementService;
exports.ElementService = ElementService = __decorate([
    (0, typedi_1.Service)(),
    __param(0, (0, typeorm_typedi_extensions_1.InjectRepository)(Element_1.Element)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], ElementService);
