import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly dataSource: DataSource) {}

  @Get('health')
  async health() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up', version: '1.0.0' };
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', database: 'down', version: '1.0.0' });
    }
  }

  @Get()
  getHello() {
    return {
      name: '酷礼工坊 API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
