import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CouponService } from './coupon.service';

@Controller('api/coupons')
@UseGuards(AuthGuard('jwt'))
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('available')
  async getAvailable(@Req() req: any) {
    const userId = req.user?.id;
    return this.couponService.getAvailableCoupons(userId);
  }

  @Post(':id/claim')
  async claim(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.couponService.claimCoupon(Number(id), userId);
  }

  @Get('mine')
  async mine(@Req() req: any) {
    const userId = req.user.id;
    return this.couponService.getUserCoupons(userId);
  }
}
