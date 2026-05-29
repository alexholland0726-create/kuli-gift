import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async findByOpenid(openid: string): Promise<User | null> {
    return this.repo.findOne({ where: { openid } });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<User>): Promise<User> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    await this.repo.update(id, data);
  }

  async addShareRecord(userId: number, productId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;
    const history = user.shareHistory || [];
    history.push({ productId, sharedAt: new Date() });
    // 分享得积分
    await this.repo.update(userId, {
      shareHistory: history,
      points: (user.points || 0) + 10,
    });
  }
}
