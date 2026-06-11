import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ShareModule } from './share/share.module';
import { CouponModule } from './coupon/coupon.module';
import { AddressModule } from './address/address.module';
import { GrouponModule } from './groupon/groupon.module';
import { PayModule } from './pay/pay.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const synchronize = config.get('TYPEORM_SYNC') === 'true'
          || (config.get('TYPEORM_SYNC') !== 'false' && config.get('NODE_ENV') !== 'production');

        return {
          type: 'mysql',
          host: config.get('DB_HOST', '127.0.0.1'),
          port: parseInt(config.get('DB_PORT', '3307')),
          username: config.get('DB_USERNAME', 'root'),
          password: config.get('DB_PASSWORD', ''),
          database: config.get('DB_DATABASE') || config.get('DB_NAME', 'kuli_gift'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize,
          charset: 'utf8mb4',
          extra: {
            connectionLimit: 10,
          },
          retryAttempts: 30,
          retryDelay: 3000,
        };
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ProductModule,
    CategoryModule,
    UserModule,
    OrderModule,
    AuthModule,
    UploadModule,
    ShareModule,
    CouponModule,
    AddressModule,
    GrouponModule,
    PayModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
