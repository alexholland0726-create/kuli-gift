import { Body, Controller, Get, Post, Put, Param, ParseIntPipe, Req, Query, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffService } from './staff.service';
import { ChangePasswordDto, CreateStaffDto, InquiryDto, InquiryStatusDto, LoginDto, ShipOrderDto, UpdateStaffDto } from './staff.dto';
import { ProductInquiry } from './inquiry.entity';
import { Product } from '../product/entities/product.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { OrderAudit } from '../order/entities/order-audit.entity';
import { DataSource } from 'typeorm';

@Controller('api/admin')
export class StaffController {
  constructor(private staff: StaffService, @InjectRepository(Product) private products: Repository<Product>, @InjectRepository(ProductInquiry) private inquiries: Repository<ProductInquiry>, @InjectRepository(Order) private orders: Repository<Order>, private dataSource: DataSource) {}
  @Post('login') login(@Body() data: LoginDto) { return this.staff.login(data.username, data.password); }
  @Get('me') me(@Req() req) { return req.staff; }
  @Put('password') password(@Req() req, @Body() data: ChangePasswordDto) { return this.staff.changePassword(req.staff.id, data.currentPassword, data.password); }
  @Get('staff') list() { return this.staff.list(); }
  @Post('staff') create(@Body() data: CreateStaffDto) { return this.staff.create(data); }
  @Put('staff/:id') update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateStaffDto) { return this.staff.update(id, data); }
  @Get('products') async catalog(
    @Query('page') page = '1',
    @Query('keyword') keyword = '',
    @Query('status') status = 'all',
    @Query('categoryId') categoryId = '',
  ) {
    const current = Math.max(1, Math.min(100000, Number(page) || 1));
    const query = this.products.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.updatedAt', 'DESC')
      .take(50)
      .skip((Math.floor(current) - 1) * 50);
    const normalizedKeyword = String(keyword || '').trim();
    if (normalizedKeyword) query.andWhere('product.name LIKE :keyword', { keyword: `%${normalizedKeyword}%` });
    if (status === 'active') query.andWhere('product.isActive = :active', { active: true });
    if (status === 'inactive') query.andWhere('product.isActive = :active', { active: false });
    if (status === 'recommended') query.andWhere('product.isRecommended = :recommended', { recommended: true });
    const normalizedCategoryId = Number(categoryId);
    if (Number.isInteger(normalizedCategoryId) && normalizedCategoryId > 0) query.andWhere('product.categoryId = :categoryId', { categoryId: normalizedCategoryId });
    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }
  @Get('inquiries') async leads(@Query('page') page = '1') {
    const current = Math.max(1, Math.min(100000, Number(page) || 1));
    const [items, total] = await this.inquiries.findAndCount({ order: { createdAt: 'DESC' }, take: 50, skip: (Math.floor(current) - 1) * 50 });
    return { items, total };
  }
  @Put('inquiries/:id') async status(@Param('id', ParseIntPipe) id: number, @Body() data: InquiryStatusDto) {
    await this.inquiries.update(id, { status: data.status });
    return { ok: true };
  }
  @Get('orders') async orderList(@Query('page') page = '1') {
    const current = Math.max(1, Math.min(100000, Number(page) || 1));
    const [items, total] = await this.orders.findAndCount({ order: { createdAt: 'DESC' }, take: 50, skip: (Math.floor(current) - 1) * 50 });
    return { items, total };
  }
  @Put('orders/:id/ship') async ship(@Param('id', ParseIntPipe) id: number, @Body() data: ShipOrderDto, @Req() req) {
    return this.dataSource.transaction(async manager => {
      const order = await manager.findOne(Order, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new BadRequestException('订单不存在');
      if (order.status !== OrderStatus.PAID) throw new BadRequestException('只有已付款订单可以发货');
      const before = order.status;
      order.status = OrderStatus.SHIPPED; order.shippedAt = new Date();
      order.trackingCompany = data.trackingCompany.trim(); order.trackingNo = data.trackingNo.trim();
      await manager.save(order);
      await manager.save(OrderAudit, manager.create(OrderAudit, { orderId: order.id, staffId: req.staff.id, action: 'ship', fromStatus: before, toStatus: order.status, detail: JSON.stringify({ trackingCompany: order.trackingCompany, trackingNo: order.trackingNo }) }));
      return order;
    });
  }
}
@Controller('api/inquiries')
export class InquiryController {
  constructor(@InjectRepository(ProductInquiry) private repo: Repository<ProductInquiry>, @InjectRepository(Product) private products: Repository<Product>) {}
  @Post() async create(@Body() data: InquiryDto) {
    if (!data.name.trim() || !data.contact.trim() || !data.message.trim()) throw new BadRequestException('请填写完整需求和联系方式');
    const items: { id: number; name: string; quantity: number }[] = [];
    for (const item of data.products) {
      const product = await this.products.findOneBy({ id: item.id, isActive: true });
      if (!product) throw new BadRequestException('部分产品已下架，请重新选择');
      items.push({ id: product.id, name: product.name, quantity: item.quantity });
    }
    const result = await this.repo.save(this.repo.create({ name: data.name.trim(), contact: data.contact.trim(), message: data.message.trim(), products: items }));
    return { id: result.id, message: '询价已提交，我们会联系您' };
  }
}
