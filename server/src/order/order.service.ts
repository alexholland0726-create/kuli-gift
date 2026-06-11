import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private repo: Repository<Order>,
  ) {}

  generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `KL${y}${m}${d}${h}${mi}${s}${rand}`;
  }

  async create(data: Partial<Order>): Promise<Order> {
    return this.repo.save({
      ...data,
      orderNo: this.generateOrderNo(),
      status: OrderStatus.PENDING,
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

    order.status = OrderStatus.CANCELLED;
    return this.repo.save(order);
  }
}
