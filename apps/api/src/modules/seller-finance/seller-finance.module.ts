import { Module } from '@nestjs/common';
import { SellerFinanceController } from './seller-finance.controller.js';
import { SellerFinanceService } from './seller-finance.service.js';

@Module({ controllers: [SellerFinanceController], providers: [SellerFinanceService] })
export class SellerFinanceModule {}
