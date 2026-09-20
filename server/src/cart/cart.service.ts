import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private repo: Repository<CartItem>,
    @InjectRepository(Product)
    private products: Repository<Product>,
  ) {}

  async findByUser(userId: number): Promise<CartItem[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { product: true },
    });
  }

  async addItem(userId: number, data: { productId: number; quantity: number; spec?: string }): Promise<CartItem> {
    const product = await this.products.findOneBy({ id: data.productId, isActive: true });
    if (!product || Number(product.price) <= 0) throw new BadRequestException('商品已下架或暂不支持在线购买');
    if (data.quantity > product.stock) throw new BadRequestException('库存不足');
    // 检查是否已存在相同商品+规格
    const existing = await this.repo.findOne({
      where: { userId, productId: data.productId, spec: data.spec || '' },
    });
    if (existing) {
      if (existing.quantity + data.quantity > product.stock || existing.quantity + data.quantity > 99) throw new BadRequestException('数量超过可购库存');
      existing.quantity += data.quantity;
      return this.repo.save(existing);
    }
    return this.repo.save({
      userId,
      productId: data.productId,
      quantity: data.quantity,
      spec: data.spec || '',
      selected: true,
    });
  }

  async updateQuantity(id: number, userId: number, quantity: number): Promise<CartItem> {
    const item = await this.repo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('购物车商品不存在');
    const product = await this.products.findOneBy({ id: item.productId, isActive: true });
    if (!product || Number(product.price) <= 0) throw new BadRequestException('商品已下架或暂不支持在线购买');
    if (quantity > product.stock) throw new BadRequestException('库存不足');
    item.quantity = quantity;
    return this.repo.save(item);
  }

  async updateSelected(ids: number[], userId: number, selected: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.repo.update({ id: In(ids), userId }, { selected });
  }

  async remove(id: number, userId: number): Promise<void> {
    const item = await this.repo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('购物车商品不存在');
    await this.repo.remove(item);
  }

  async clear(userId: number): Promise<void> {
    await this.repo.delete({ userId });
  }
}
