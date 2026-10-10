import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards.js';
import { CreateWithdrawalDto } from './seller-finance.dto.js';
import { SellerFinanceService } from './seller-finance.service.js';

@ApiTags('seller-finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
@Controller('seller')
export class SellerFinanceController {
  constructor(private readonly finance: SellerFinanceService) {}
  @Get('dashboard') summary(@CurrentUser() user: AuthUser) { return this.finance.summary(user.id); }
  @Get('wallet') wallet(@CurrentUser() user: AuthUser) { return this.finance.walletDetail(user.id); }
  @Post('withdrawals') withdraw(@CurrentUser() user: AuthUser, @Body() dto: CreateWithdrawalDto) { return this.finance.withdraw(user.id, dto); }
}
