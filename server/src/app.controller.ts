import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return {
      name: '酷礼工坊 API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
