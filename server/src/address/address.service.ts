import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
  ) {}

  async findByUser(userId: number) {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(userId: number, data: Partial<Address>) {
    if (data.isDefault) {
      await this.clearDefault(userId);
    }
    return this.addressRepo.save(this.addressRepo.create({ ...data, userId }));
  }

  async update(id: number, userId: number, data: Partial<Address>) {
    const addr = await this.addressRepo.findOne({ where: { id, userId } });
    if (!addr) throw new NotFoundException('地址不存在');
    if (data.isDefault) {
      await this.clearDefault(userId);
    }
    Object.assign(addr, data);
    return this.addressRepo.save(addr);
  }

  async remove(id: number, userId: number) {
    const addr = await this.addressRepo.findOne({ where: { id, userId } });
    if (!addr) throw new NotFoundException('地址不存在');
    return this.addressRepo.remove(addr);
  }

  private async clearDefault(userId: number) {
    await this.addressRepo.update({ userId, isDefault: true }, { isDefault: false });
  }
}
