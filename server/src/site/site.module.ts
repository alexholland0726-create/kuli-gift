import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSetting } from './site-setting.entity';
import { AdminSiteController, SiteController } from './site.controller';
import { SiteService } from './site.service';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSetting, Category])],
  controllers: [SiteController, AdminSiteController],
  providers: [SiteService],
})
export class SiteModule {}
