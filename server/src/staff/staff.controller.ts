import { Body, Controller, Get, Post, Put, Param, ParseIntPipe, Req, Query, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffService } from './staff.service';
import { ChangePasswordDto, CreateStaffDto, InquiryDto, InquiryStatusDto, LoginDto, UpdateStaffDto } from './staff.dto';
import { ProductInquiry } from './inquiry.entity';
import { Product } from '../product/entities/product.entity';

@Controller('api/admin')
export class StaffController {
  constructor(private staff: StaffService, @InjectRepository(Product) private products: Repository<Product>, @InjectRepository(ProductInquiry) private inquiries: Repository<ProductInquiry>) {}
  @Post('login') login(@Body() data: LoginDto) { return this.staff.login(data.username, data.password); }
  @Get('me') me(@Req() req) { return req.staff; }
  @Put('password') password(@Req() req, @Body() data: ChangePasswordDto) { return this.staff.changePassword(req.staff.id, data.currentPassword, data.password); }
  @Get('staff') list() { return this.staff.list(); }
  @Post('staff') create(@Body() data: CreateStaffDto) { return this.staff.create(data); }
  @Put('staff/:id') update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateStaffDto) { return this.staff.update(id, data); }
  @Get('products') async catalog(@Query('page') page = '1') {
    const current = Math.max(1, Math.min(100000, Number(page) || 1));
    const [items, total] = await this.products.findAndCount({ order: { updatedAt: 'DESC' }, take: 50, skip: (Math.floor(current) - 1) * 50 });
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
