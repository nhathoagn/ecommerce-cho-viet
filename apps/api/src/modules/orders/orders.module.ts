import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import {
  OrdersController,
  SellerOrdersController,
} from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, SellerOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
