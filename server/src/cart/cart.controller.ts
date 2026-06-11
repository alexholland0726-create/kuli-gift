import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user.id;
    return this.service.findByUser(userId);
  }

  @Post()
  async add(@Body() body: { productId: number; quantity: number; spec?: string }, @Req() req: any) {
    const userId = req.user.id;
    return this.service.addItem(userId, body);
  }

  @Put(':id/quantity')
  async updateQuantity(@Param('id', ParseIntPipe) id: number, @Body() body: { quantity: number }, @Req() req: any) {
    const userId = req.user.id;
    return this.service.updateQuantity(id, userId, body.quantity);
  }

  @Put('select')
  async select(@Body() body: { ids: number[]; selected: boolean }, @Req() req: any) {
    const userId = req.user.id;
    return this.service.updateSelected(body.ids, userId, body.selected);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.id;
    await this.service.remove(id, userId);
    return { success: true };
  }

  @Delete()
  async clear(@Req() req: any) {
    const userId = req.user.id;
    await this.service.clear(userId);
    return { success: true };
  }
}
