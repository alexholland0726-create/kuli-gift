import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class ShareService {
  constructor(
    private userService: UserService,
  ) {}

  async recordShare(userId: number, productId: number): Promise<{ points: number }> {
    await this.userService.addShareRecord(userId, productId);
    return { points: 10 };
  }

  async getShareStats(userId: number): Promise<{ totalShares: number; points: number }> {
    const user = await this.userService.findById(userId);
    if (!user) return { totalShares: 0, points: 0 };
    return {
      totalShares: user.shareHistory?.length || 0,
      points: user.points || 0,
    };
  }
}
