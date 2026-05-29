import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  async findAll(query: { categoryId?: number; keyword?: string; recommended?: boolean; page?: number; limit?: number }): Promise<{ items: Product[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = { isActive: true };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.recommended) where.isRecommended = true;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['category'] as any,
    });
    return { items, total };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({ where: { id }, relations: ['category'] as any });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async create(data: Partial<Product>): Promise<Product> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
