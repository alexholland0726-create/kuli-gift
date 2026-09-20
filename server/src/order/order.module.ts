import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { Address } from '../address/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, CartItem, Product, Address])],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [TypeOrmModule, OrderService],
})
export class OrderModule {}
