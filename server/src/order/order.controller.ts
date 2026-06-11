import { BadRequestException, Controller, Get, Post, Put, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './entities/order.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/orders')
export class OrderController {
  constructor(private service: OrderService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() data: Partial<Order>, @Req() req: any) {
    return this.service.create({ ...data, userId: req.user.id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findByUser(@Req() req) {
    return this.service.findByUser(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: OrderStatus }, @Req() req: any) {
    if (body.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException('订单状态只能由支付回调或管理后台更新');
    }
    return this.service.cancel(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.cancel(id, req.user.id);
  }
}
