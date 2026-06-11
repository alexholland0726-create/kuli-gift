import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private userCouponRepo: Repository<UserCoupon>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // 获取可用优惠券列表
  async getAvailableCoupons(userId?: number) {
    const now = new Date();
    const coupons = await this.couponRepo.find({
      where: { isActive: true, startTime: LessThan(now) },
      order: { createdAt: 'DESC' },
    });

    // 过滤已过期/已领完的
    const valid = [];
    for (const c of coupons) {
      if (c.endTime && c.endTime < now) continue;
      if (c.totalStock > 0 && c.usedStock >= c.totalStock) continue;
      if (userId) {
        const count = await this.userCouponRepo.count({ where: { userId, couponId: c.id } });
        if (count >= c.perUserLimit) continue;
      }
      valid.push(c);
    }
    return valid;
  }

  // 领取优惠券
  async claimCoupon(couponId: number, userId: number) {
    const coupon = await this.couponRepo.findOne({ where: { id: couponId, isActive: true } });
    if (!coupon) throw new NotFoundException('优惠券不存在');

    if (coupon.endTime && coupon.endTime < new Date())
      throw new BadRequestException('优惠券已过期');

    if (coupon.totalStock > 0 && coupon.usedStock >= coupon.totalStock)
      throw new BadRequestException('优惠券已领完');

    const count = await this.userCouponRepo.count({ where: { userId, couponId } });
    if (count >= coupon.perUserLimit)
      throw new BadRequestException('已达领取上限');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    // 新人专享券：用户必须有0个订单
    if (coupon.scope === 'newbie') {
      const orderCount = await this.getUserOrderCount(userId);
      if (orderCount > 0) throw new BadRequestException('该券仅限新用户领取');
    }

    await this.couponRepo.update(couponId, { usedStock: coupon.usedStock + 1 });

    const uc = this.userCouponRepo.create({ couponId, userId });
    return this.userCouponRepo.save(uc);
  }

  // 获取用户优惠券
  async getUserCoupons(userId: number, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.userCouponRepo.find({
      where,
      relations: { coupon: true },
      order: { gotAt: 'DESC' },
    });
  }

  // 核销优惠券（下单时使用）
  async useCoupon(userCouponId: number, userId: number, orderId: number) {
    const uc = await this.userCouponRepo.findOne({
      where: { id: userCouponId, userId, status: 'unused' },
      relations: { coupon: true },
    });
    if (!uc) throw new BadRequestException('优惠券不可用');
    if (uc.coupon.endTime && uc.coupon.endTime < new Date())
      throw new BadRequestException('优惠券已过期');

    uc.status = 'used';
    uc.usedAt = new Date();
    uc.orderId = orderId;
    return this.userCouponRepo.save(uc);
  }

  // 计算优惠金额
  calculateDiscount(coupon: Coupon, orderAmount: number): number {
    if (orderAmount < coupon.minAmount) return 0;
    switch (coupon.type) {
      case 'full_reduce': return Math.min(coupon.value, orderAmount);
      case 'discount': return orderAmount * (1 - coupon.value / 10);
      default: return 0;
    }
  }

  // 每天清理过期优惠券
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireCoupons() {
    const now = new Date();
    await this.userCouponRepo
      .createQueryBuilder()
      .update(UserCoupon)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'unused' })
      .andWhere(
        'couponId IN (SELECT id FROM coupons WHERE endTime IS NOT NULL AND endTime < :now)',
        { now },
      )
      .execute();
  }

  private async getUserOrderCount(userId: number): Promise<number> {
    const { Order } = require('../order/entities/order.entity');
    const count = await this.userCouponRepo.manager
      .createQueryBuilder(Order, 'o')
      .where('o.userId = :userId', { userId })
      .getCount();
    return count;
  }
}
