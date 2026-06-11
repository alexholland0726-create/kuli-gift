import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, UserCoupon, User]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
