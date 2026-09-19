import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpAdapterHost } from '@nestjs/core';
import { UploadsExceptionFilter } from './uploads-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string>('CORS_ORIGINS', '')
    .split(',').map(value => value.trim()).filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
  });

  app.setGlobalPrefix('', { exclude: ['/'] });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new UploadsExceptionFilter(app.get(HttpAdapterHost)));

  const port = configService.get('APP_PORT', 3001);

  await app.listen(port);
  console.log(`酷礼工坊 API running on http://localhost:${port}`);
}
bootstrap();
