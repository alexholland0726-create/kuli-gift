import { Controller, Post, Get, Body, Req, Param, Headers } from '@nestjs/common';
import { PayService } from './pay.service';
import { Request } from 'express';

@Controller('api/pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  /**
   * 创建微信支付订单（小程序调起前调此接口）
   * 对应小程序端：wx.requestPayment({ ...返回的参数 })
   */
  @Post('create')
  async createOrder(@Body() body: { orderId: number }, @Req() req: Request) {
    const userId = (req as any).user?.id || 1;
    const openid = (req as any).user?.openid || 'mock_openid';
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return this.payService.createOrder(body.orderId, userId, openid, ip);
  }

  /**
   * 微信支付回调通知
   * POST notify_url
   */
  @Post('notify')
  async notify(@Headers() headers: any, @Body() body: any) {
    // 返回微信要求的格式：{"code":"SUCCESS","message":"成功"}
    return this.payService.handleNotify(headers, body);
  }

  /**
   * 查询支付状态
   */
  @Get('status/:orderNo')
  async status(@Param('orderNo') orderNo: string) {
    return this.payService.queryPayStatus(orderNo);
  }

  /**
   * 关闭订单
   */
  @Post('close/:orderNo')
  async close(@Param('orderNo') orderNo: string) {
    return this.payService.closeOrder(orderNo);
  }
}
