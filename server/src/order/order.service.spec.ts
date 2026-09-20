import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

function managerWithStock(affected = 1) {
  const query = { update: jest.fn(), set: jest.fn(), where: jest.fn(), execute: jest.fn(async () => ({ affected })) } as any;
  query.update.mockReturnValue(query); query.set.mockReturnValue(query); query.where.mockReturnValue(query);
  return {
    findOne: jest.fn(async (entity) => entity.name === 'Address' ? { id: 2, userId: 7, name: '张三', phone: '13800000000', province: '浙江', city: '杭州', district: '西湖', detail: '1号' } : null),
    find: jest.fn(async () => [{ id: 1, userId: 7, productId: 9, quantity: 2, spec: '', product: { id: 9, name: '礼盒', coverImage: '/uploads/a.jpg', price: '12.34', stock: 5, isActive: true } }]),
    createQueryBuilder: jest.fn(() => query),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async value => ({ id: 10, ...value })),
    delete: jest.fn(async () => ({ affected: 1 })),
  };
}

describe('OrderService secure checkout', () => {
  async function serviceWithStock(affected = 1) {
    const manager = managerWithStock(affected);
    const dataSource = { transaction: jest.fn(async fn => fn(manager)) };
    const module = await Test.createTestingModule({ providers: [OrderService, { provide: getRepositoryToken(Order), useValue: {} }, { provide: DataSource, useValue: dataSource }] }).compile();
    return { service: module.get(OrderService), manager };
  }

  it('calculates the amount from server product data and reserves stock', async () => {
    const { service, manager } = await serviceWithStock();
    const result = await service.create(7, { cartItemIds: [1], addressId: 2, remark: ' 测试 ' });
    expect(result).toMatchObject({ totalAmount: 24.68, payAmount: 24.68, userId: 7, remark: '测试' });
    expect(result.items[0]).toMatchObject({ productId: 9, price: 12.34, quantity: 2 });
    expect(manager.delete).toHaveBeenCalled();
  });

  it('aborts checkout when atomic stock reservation fails', async () => {
    const { service, manager } = await serviceWithStock(0);
    await expect(service.create(7, { cartItemIds: [1], addressId: 2 })).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});
