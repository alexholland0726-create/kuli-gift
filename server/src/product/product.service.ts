import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async findAll(query: { categoryId?: number; keyword?: string; recommended?: boolean; page?: number; limit?: number }): Promise<{ items: Product[]; total: number }> {
    const page = Math.max(1, Math.min(100000, Math.floor(Number(query.page) || 1)));
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query.limit) || 20)));
    const where: any = { isActive: true };

    if (query.categoryId) {
      const selectedCategoryId = Number(query.categoryId);
      const children = await this.categoryRepo.find({ where: { parentId: selectedCategoryId } });
      const categoryIds = [selectedCategoryId, ...children.map(category => category.id)];
      where.categoryId = In(categoryIds);
    }
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.recommended === true || String(query.recommended) === 'true') where.isRecommended = true;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: { category: true },
    });
    return { items, total };
  }

  async findOne(id: number, publicOnly = false): Promise<Product> {
    const product = await this.repo.findOne({ where: { id, ...(publicOnly ? { isActive: true } : {}) }, relations: { category: true } });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async create(data: Partial<Product>): Promise<Product> {
    await this.validateCatalog(data);
    return this.repo.save({ ...data, isActive: data.isActive ?? false });
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    await this.findOne(id);
    await this.validateCatalog(data);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }
  private async validateCatalog(data: Partial<Product>) {
    if (!data.name?.trim()) throw new BadRequestException('请填写产品名称');
    if (data.categoryId && !await this.categoryRepo.findOneBy({ id: data.categoryId, isActive: true })) throw new BadRequestException('请选择有效分类');
  }
}
