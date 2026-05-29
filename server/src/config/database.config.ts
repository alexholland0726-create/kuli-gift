import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const databaseConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql' as const,
    host: configService.get('DB_HOST', '127.0.0.1'),
    port: parseInt(configService.get('DB_PORT', '3307')),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_NAME', 'kuli_gift'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
    charset: 'utf8mb4',
    logging: false,
  }),
  inject: [ConfigService],
};
