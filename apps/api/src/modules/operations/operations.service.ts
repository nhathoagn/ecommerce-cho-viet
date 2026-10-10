import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WithdrawalStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { UpdateWithdrawalDto } from './operations.dto.js';

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}
  async overview() {
    const [users, stores, orders, successfulPayments, pendingWithdrawals] = await Promise.all([
      this.prisma.user.count(), this.prisma.store.count(), this.prisma.order.count(),
      this.prisma.payment.count({ where: { status: 'SUCCESS' } }),
      this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    ]);
    return { users, stores, orders, successfulPayments, pendingWithdrawals };
  }
  withdrawals() { return this.prisma.withdrawalRequest.findMany({ include: { wallet: { include: { seller: { select: { id: true, name: true, email: true } } } } }, orderBy: { createdAt: 'desc' } }); }
  async updateWithdrawal(id: string, dto: UpdateWithdrawalDto) {
    const current = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Withdrawal not found');
    const allowed =
      (current.status === WithdrawalStatus.PENDING &&
        (dto.status === WithdrawalStatus.APPROVED || dto.status === WithdrawalStatus.REJECTED)) ||
      (current.status === WithdrawalStatus.APPROVED && dto.status === WithdrawalStatus.PAID);
    if (!allowed) throw new BadRequestException('Invalid withdrawal transition');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.withdrawalRequest.update({ where: { id }, data: dto });
      if (dto.status === WithdrawalStatus.REJECTED) {
        await tx.sellerWallet.update({ where: { id: current.walletId }, data: { availableBalance: { increment: current.amount } } });
        await tx.walletTransaction.create({
          data: {
            walletId: current.walletId,
            reference: `WITHDRAWAL_REJECTED:${id}`,
            type: WalletTransactionType.ADJUSTMENT,
            amount: current.amount,
            description: `Withdrawal ${id} rejected and balance restored`,
          },
        });
      }
      await tx.auditLog.create({ data: { action: 'WITHDRAWAL_STATUS_UPDATED', entityType: 'WithdrawalRequest', entityId: id, metadata: { from: current.status, to: dto.status, note: dto.note } } });
      return result;
    });
  }
}
