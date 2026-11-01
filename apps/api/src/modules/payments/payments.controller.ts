import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards.js';
import { PaymentsService } from './payments.service.js';

class RefundDto {
  @IsOptional() @IsNumber() @Min(1) amount?: number;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':orderId')
  create(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.create(user.id, orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':orderId/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.confirm(user.id, orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':orderId/status')
  status(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.status(user.id, orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post(':orderId/refund')
  refund(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: RefundDto,
  ) {
    return this.payments.refund(user.id, orderId, dto.amount);
  }
}
