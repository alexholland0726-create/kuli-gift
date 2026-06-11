import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PayService } from './pay.service';

@Controller('api/pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async createOrder(@Body() body: { orderId: number }, @Req() req: Request) {
    const user = (req as any).user;
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return this.payService.createOrder(body.orderId, user.id, user.openid, ip);
  }

  @Post('notify')
  async notify(@Headers() headers: Record<string, string>, @Body() body: any, @Req() req: Request) {
    const rawBody = ((req as any).rawBody as Buffer | undefined)?.toString('utf8') || JSON.stringify(body);
    return this.payService.handleNotify(headers, body, rawBody);
  }

  @Get('status/:orderNo')
  async status(@Param('orderNo') orderNo: string) {
    return this.payService.queryPayStatus(orderNo);
  }

  @Post('close/:orderNo')
  async close(@Param('orderNo') orderNo: string) {
    return this.payService.closeOrder(orderNo);
  }
}
