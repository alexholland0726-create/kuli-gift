import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './order.dto';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { Address } from '../address/entities/address.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private repo: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const rand = randomBytes(5).toString('hex').toUpperCase();
    return `KL${y}${m}${d}${h}${mi}${s}${rand}`;
  }

  async create(userId: number, data: CreateOrderDto): Promise<Order> {
    const cartItemIds = [...new Set(data.cartItemIds)];
    if (cartItemIds.length !== data.cartItemIds.length) throw new BadRequestException('购物车项目不能重复');

    return this.dataSource.transaction(async manager => {
      const address = await manager.findOne(Address, { where: { id: data.addressId, userId } });
      if (!address) throw new BadRequestException('收货地址不存在');

      const cartItems = await manager.find(CartItem, {
        where: { id: In(cartItemIds), userId },
        relations: { product: true },
        order: { id: 'ASC' },
      });
      if (cartItems.length !== cartItemIds.length) throw new BadRequestException('购物车中有无效项目');

      let totalCents = 0;
      const items: Order['items'] = [];
      for (const cart of cartItems) {
        const product = cart.product;
        const quantity = Math.floor(Number(cart.quantity));
        const priceCents = Math.round(Number(product?.price || 0) * 100);
        if (!product?.isActive || quantity < 1 || priceCents < 1) throw new BadRequestException('商品已下架或暂不支持在线购买');
        const reserved = await manager.createQueryBuilder().update(Product)
          .set({ stock: () => `stock - ${quantity}` })
          .where('id = :id AND isActive = :active AND stock >= :quantity', { id: product.id, active: true, quantity })
          .execute();
        if (reserved.affected !== 1) throw new BadRequestException(`${product.name} 库存不足`);
        totalCents += priceCents * quantity;
        items.push({ productId: product.id, name: product.name, coverImage: product.coverImage || '', price: priceCents / 100, quantity, spec: cart.spec || '' });
      }

      const order = manager.create(Order, {
        userId,
        orderNo: this.generateOrderNo(),
        items,
        totalAmount: totalCents / 100,
        discountAmount: 0,
        payAmount: totalCents / 100,
        status: OrderStatus.PENDING,
        consignee: address.name,
        phone: address.phone,
        address: `${address.province}${address.city}${address.district}${address.detail}`,
        remark: data.remark?.trim() || null,
      });
      const saved = await manager.save(order);
      await manager.delete(CartItem, { id: In(cartItemIds), userId });
      return saved;
    });
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId?: number): Promise<Order> {
    const order = await this.repo.findOne({ where: userId ? { id, userId } : { id } });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async findByOrderNo(orderNo: string, userId?: number): Promise<Order> {
    const order = await this.repo.findOne({ where: userId ? { orderNo, userId } : { orderNo } });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const updateData: any = { status };
    if (status === OrderStatus.PAID) updateData.paidAt = new Date();
    if (status === OrderStatus.SHIPPED) updateData.shippedAt = new Date();
    if (status === OrderStatus.COMPLETED) updateData.completedAt = new Date();
    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async cancel(id: number, userId: number): Promise<Order> {
    const order = await this.repo.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只有待付款订单可以取消');
    }

    return this.dataSource.transaction(async manager => {
      const locked = await manager.findOne(Order, { where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!locked) throw new NotFoundException('订单不存在');
      if (locked.status !== OrderStatus.PENDING) throw new BadRequestException('只有待付款订单可以取消');
      for (const item of locked.items) {
        await manager.createQueryBuilder().update(Product).set({ stock: () => `stock + ${Math.max(0, Math.floor(item.quantity))}` }).where('id = :id', { id: item.productId }).execute();
      }
      locked.status = OrderStatus.CANCELLED;
      return manager.save(locked);
    });
  }

  async cancelByOrderNo(orderNo: string, userId: number): Promise<Order> {
    const order = await this.findByOrderNo(orderNo, userId);
    return this.cancel(order.id, userId);
  }
}
