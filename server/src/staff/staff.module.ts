import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { StaffAccount } from './staff.entity';
import { ProductInquiry } from './inquiry.entity';
import { Product } from '../product/entities/product.entity';
import { StaffService } from './staff.service';
import { AccessGuard } from './access.guard';
import { StaffController, InquiryController } from './staff.controller';
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StaffAccount, ProductInquiry, Product]), JwtModule.register({})],
  providers: [StaffService, { provide: APP_GUARD, useClass: AccessGuard }],
  controllers: [StaffController, InquiryController],
})
export class StaffModule {}
