import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GrouponActivity } from './entities/groupon-activity.entity';
import { GrouponOrder } from './entities/groupon-order.entity';

@Injectable()
export class GrouponService {
  constructor(
    @InjectRepository(GrouponActivity)
    private activityRepo: Repository<GrouponActivity>,
    @InjectRepository(GrouponOrder)
    private grouponOrderRepo: Repository<GrouponOrder>,
  ) {}

  // 获取进行中的拼团活动
  async getActiveActivities() {
    const now = new Date();
    return this.activityRepo.find({
      where: { status: 'active', startTime: LessThan(now), endTime: MoreThan(now) },
      order: { createdAt: 'DESC' },
    });
  }

  // 开团
  async createGroup(activityId: number, userId: number) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId, status: 'active' } });
    if (!activity) throw new NotFoundException('拼团活动不存在或已结束');
    if (activity.endTime < new Date()) throw new BadRequestException('拼团已结束');

    const order = this.grouponOrderRepo.create({
      activityId, userId, payAmount: activity.groupPrice,
      isLeader: true, status: 'paying',
    });
    const saved = await this.grouponOrderRepo.save(order);
    // 团ID = 自己的订单ID
    saved.groupId = saved.id;
    return this.grouponOrderRepo.save(saved);
  }

  // 参团
  async joinGroup(activityId: number, groupId: number, userId: number) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId, status: 'active' } });
    if (!activity) throw new NotFoundException('拼团活动不存在');

    const groupOrders = await this.grouponOrderRepo.find({
      where: { activityId, groupId, status: 'paid' },
    });
    if (groupOrders.length >= activity.targetNum) {
      throw new BadRequestException('该团已满');
    }

    const alreadyJoined = await this.grouponOrderRepo.findOne({
      where: { activityId, userId },
    });
    if (alreadyJoined) throw new BadRequestException('你已参加该拼团活动');

    const order = this.grouponOrderRepo.create({
      activityId, groupId, userId, payAmount: activity.groupPrice,
      isLeader: false, status: 'paying',
    });
    return this.grouponOrderRepo.save(order);
  }

  // 支付后回调（模拟支付成功）
  async onPaySuccess(grouponOrderId: number) {
    const order = await this.grouponOrderRepo.findOne({
      where: { id: grouponOrderId },
      relations: ['activity'] as any,
    });
    if (!order) throw new NotFoundException('拼团订单不存在');

    order.status = 'paid';
    await this.grouponOrderRepo.save(order);

    // 检查是否成团
    const groupId = order.groupId;
    const activity = order.activity;
    const paidOrders = await this.grouponOrderRepo.find({
      where: { groupId, activityId: order.activityId, status: 'paid' },
    });

    if (paidOrders.length >= activity.targetNum) {
      // 成团 — 所有团员状态改为 success
      await this.grouponOrderRepo.update(
        { groupId: groupId, activityId: order.activityId },
        { status: 'success' },
      );
    }

    return order;
  }

  // 获取拼团进度
  async getGroupProgress(activityId: number, groupId: number) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('活动不存在');

    const orders = await this.grouponOrderRepo.find({
      where: { activityId, groupId },
    });
    const paidCount = orders.filter(o => o.status === 'paid' || o.status === 'success').length;

    return {
      activityId,
      groupId,
      targetNum: activity.targetNum,
      currentNum: paidCount,
      remaining: activity.targetNum - paidCount,
      orders,
    };
  }

  // 每分钟检查超时未成团的订单，自动退款
  @Cron(CronExpression.EVERY_MINUTE)
  async checkTimeoutGroups() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const timeoutOrders = await this.grouponOrderRepo.find({
      where: { status: 'paid', createdAt: LessThan(oneHourAgo) },
      relations: ['activity'] as any,
    });

    for (const order of timeoutOrders) {
      const activity = order.activity;
      const groupId = order.groupId;
      const allPaid = await this.grouponOrderRepo.find({
        where: { groupId, activityId: order.activityId, status: 'paid' },
      });
      // 如果超时了还没成团
      if (allPaid.length < activity.targetNum) {
        await this.grouponOrderRepo.update(
          { groupId, activityId: order.activityId },
          { status: 'timeout' },
        );
        // 这里应该触发退款逻辑
      }
    }
  }
}
