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

  async findAll(includeInactive = false): Promise<Category[]> {
    const categories = await this.repo.find({
      where: includeInactive ? {} : { isActive: true },
      relations: { children: true },
      order: { sort: 'ASC' },
    });
    return categories.map(category => ({
      ...category,
      children: (category.children || []).filter(child => includeInactive || child.isActive)
        .sort((a, b) => a.sort - b.sort),
    }));
  }

  async findOne(id: number): Promise<Category> {
    const cat = await this.repo.findOne({ where: { id, isActive: true }, relations: { products: true } });
    if (!cat) throw new NotFoundException('分类不存在');
    cat.products = (cat.products || []).filter(product => product.isActive);
    return cat;
  }

  async create(data: Partial<Category>): Promise<Category> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const category = await this.repo.findOneBy({ id });
    if (!category) throw new NotFoundException('分类不存在');
    return this.repo.save({ ...category, ...data });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
