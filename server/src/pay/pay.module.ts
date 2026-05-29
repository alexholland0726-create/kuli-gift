import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService],
})
export class PayModule {}
