import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './order.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/orders')
export class OrderController {
  constructor(private service: OrderService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() data: CreateOrderDto, @Req() req: any) {
    return this.service.create(req.user.id, data);
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

}
