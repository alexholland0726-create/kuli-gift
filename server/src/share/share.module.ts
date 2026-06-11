import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';

@Module({
  imports: [TypeOrmModule.forFeature([]), UserModule],
  providers: [ShareService],
  controllers: [ShareController],
})
export class ShareModule {}
