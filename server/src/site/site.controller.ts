import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HomeLayoutDto } from './site.dto';
import { SiteService } from './site.service';

@Controller('api/site')
export class SiteController {
  constructor(private site: SiteService, private config: ConfigService) {}
  @Get('home') home() { return this.site.publishedHome(); }
  @Get('capabilities') capabilities() { return { commerceEnabled: this.config.get('COMMERCE_ENABLED') === 'true' }; }
}

@Controller('api/admin/site')
export class AdminSiteController {
  constructor(private site: SiteService) {}
  @Get('home') home() { return this.site.adminHome(); }
  @Put('home/draft') draft(@Body() value: HomeLayoutDto) { return this.site.saveDraft(value); }
  @Post('home/publish') publish() { return this.site.publish(); }
  @Post('home/restore') restore() { return this.site.restorePublished(); }
}
