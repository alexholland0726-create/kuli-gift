import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.repo.find({ order: { sort: 'ASC' } });
  }

  async findOne(id: number): Promise<Category> {
    const cat = await this.repo.findOne({ where: { id }, relations: { products: true } });
    if (!cat) throw new NotFoundException('分类不存在');
    return cat;
  }

  async create(data: Partial<Category>): Promise<Category> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
