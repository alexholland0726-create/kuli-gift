import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { GrouponController } from './groupon.controller';
import { GrouponService } from './groupon.service';
import { GrouponActivity } from './entities/groupon-activity.entity';
import { GrouponOrder } from './entities/groupon-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GrouponActivity, GrouponOrder]),
    ScheduleModule.forRoot(),
  ],
  controllers: [GrouponController],
  providers: [GrouponService],
  exports: [GrouponService],
})
export class GrouponModule {}
