import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SellerCatalogModule } from './modules/seller-catalog/seller-catalog.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { SellerFinanceModule } from './modules/seller-finance/seller-finance.module.js';
import { OperationsModule } from './modules/operations/operations.module.js';

export const pinoRedactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.secretKey',
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: pinoRedactPaths,
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              }
            : undefined,
      },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SellerCatalogModule,
    UploadsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    SellerFinanceModule,
    OperationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
