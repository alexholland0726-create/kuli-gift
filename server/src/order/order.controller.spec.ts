import { Test } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController', () => {
  it('can be constructed with its service', async () => {
    const module = await Test.createTestingModule({ controllers: [OrderController], providers: [{ provide: OrderService, useValue: {} }] }).compile();
    expect(module.get(OrderController)).toBeDefined();
  });
});
