import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CouponService } from './coupon.service';

@Controller('api/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('available')
  async getAvailable(@Req() req: any) {
    const userId = req.user?.id;
    return this.couponService.getAvailableCoupons(userId);
  }

  @Post(':id/claim')
  async claim(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 1; // 临时默认
    return this.couponService.claimCoupon(Number(id), userId);
  }

  @Get('mine')
  async mine(@Req() req: any) {
    const userId = req.user?.id || 1;
    return this.couponService.getUserCoupons(userId);
  }
}
