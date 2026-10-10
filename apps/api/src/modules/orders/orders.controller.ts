import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards.js';
import {
  CheckoutDto,
  CreateCouponDto,
  UpdateOrderStatusDto,
} from './orders.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user.id, dto);
  }
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.orders.buyerOrders(user.id);
  }
  @Get(':id') detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.buyerOrder(user.id, id);
  }
  @Post(':id/cancel') cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.orders.cancel(user.id, id);
  }
}

@ApiTags('seller-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
@Controller('seller')
export class SellerOrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get('orders') list(@CurrentUser() user: AuthUser) {
    return this.orders.sellerOrders(user.id);
  }
  @Patch('orders/:id/status') status(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.sellerUpdate(user.id, id, dto);
  }
  @Post('coupons') coupon(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCouponDto,
  ) {
    return this.orders.createCoupon(user.id, dto);
  }
}
