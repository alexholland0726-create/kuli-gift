import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('', { exclude: ['/'] });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const configService = app.get(ConfigService);
  const port = configService.get('APP_PORT', 3001);

  await app.listen(port);
  console.log(`酷礼工坊 API running on http://localhost:${port}`);
}
bootstrap();
