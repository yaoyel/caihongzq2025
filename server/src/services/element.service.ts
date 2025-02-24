import { Service } from 'typedi'; 
import { Repository } from 'typeorm';
import { Element } from '../entities/Element';
import { AppDataSource } from '../data-source';

@Service()
export class ElementService {
    private elementRepository: Repository<Element>; 

    constructor() { 
        this.elementRepository = AppDataSource.getRepository(Element);
    }
 

    async findAll() {
        return this.elementRepository.find();
    }

    async findOne(id: number) {
        return this.elementRepository.findOne({ where: { id } });
    }

    async create(data: Partial<Element>) {
        const element = this.elementRepository.create(data);
        return this.elementRepository.save(element);
    }

    async update(id: number, data: Partial<Element>) {
        await this.elementRepository.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        await this.elementRepository.delete(id);
    }
} 