import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './entities/order.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/orders')
export class OrderController {
  constructor(private service: OrderService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() data: Partial<Order>) {
    return this.service.create(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findByUser(@Req() req) {
    return this.service.findByUser(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: OrderStatus }) {
    return this.service.updateStatus(id, body.status);
  }
}
