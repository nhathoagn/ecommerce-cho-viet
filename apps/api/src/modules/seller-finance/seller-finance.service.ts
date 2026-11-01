import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateWithdrawalDto } from './seller-finance.dto.js';

@Injectable()
export class SellerFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async store(sellerId: string) {
    const store = await this.prisma.store.findUnique({ where: { sellerId } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  private async wallet(sellerId: string) {
    try {
      return await this.prisma.sellerWallet.upsert({
        where: { sellerId },
        create: { sellerId },
        update: {},
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.prisma.sellerWallet.findUniqueOrThrow({ where: { sellerId } });
      }
      throw error;
    }
  }

  async summary(sellerId: string) {
    const store = await this.store(sellerId);
    const wallet = await this.wallet(sellerId);
    const [productCount, lowStockCount, orderCount, pendingOrderCount, revenue] = await Promise.all([
      this.prisma.product.count({ where: { storeId: store.id } }),
      this.prisma.product.count({ where: { storeId: store.id, stock: { lte: 5 } } }),
      this.prisma.order.count({ where: { storeId: store.id } }),
      this.prisma.order.count({ where: { storeId: store.id, status: { in: [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PACKING] } } }),
      this.prisma.order.aggregate({
        where: { storeId: store.id, payment: { status: { in: ['SUCCESS', 'REFUNDED'] } } },
        _sum: { totalAmount: true },
      }),
    ]);
    return {
      store,
      productCount,
      lowStockCount,
      orderCount,
      pendingOrderCount,
      grossRevenue: Number(revenue._sum.totalAmount ?? 0),
      availableBalance: Number(wallet.availableBalance),
    };
  }

  async walletDetail(sellerId: string) {
    const wallet = await this.wallet(sellerId);
    const [transactions, withdrawals] = await Promise.all([
      this.prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.withdrawalRequest.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return { ...wallet, availableBalance: Number(wallet.availableBalance), transactions, withdrawals };
  }

  async withdraw(sellerId: string, dto: CreateWithdrawalDto) {
    const wallet = await this.wallet(sellerId);
    if (Number(wallet.availableBalance) < dto.amount) throw new BadRequestException('Insufficient wallet balance');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sellerWallet.updateMany({
        where: { id: wallet.id, availableBalance: { gte: new Prisma.Decimal(dto.amount) } },
        data: { availableBalance: { decrement: new Prisma.Decimal(dto.amount) } },
      });
      if (updated.count !== 1) throw new BadRequestException('Insufficient wallet balance');
      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountName: dto.accountName,
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          reference: `WITHDRAWAL:${withdrawal.id}`,
          type: WalletTransactionType.WITHDRAWAL_DEBIT,
          amount: new Prisma.Decimal(-dto.amount),
          description: `Withdrawal to ${dto.bankName} ${dto.accountNumber}`,
        },
      });
      return withdrawal;
    });
  }
}
