import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { WithdrawalStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { OperationsGuard } from './operations.guard.js';
import { OperationsService } from './operations.service.js';
import { SellerFinanceService } from '../seller-finance/seller-finance.service.js';

const statuses = [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED, WithdrawalStatus.PAID];
const allowed = new Set(['PENDING->APPROVED', 'PENDING->REJECTED', 'APPROVED->PAID']);

describe('OperationsService', () => {
  it.each(statuses.flatMap((from) => statuses.map((to) => [from, to] as const)))(
    'withdrawal %s to %s',
    async (from, to) => {
      const tx = {
        withdrawalRequest: { update: vi.fn().mockResolvedValue({ status: to }) },
        sellerWallet: { update: vi.fn() },
        walletTransaction: { create: vi.fn() },
        auditLog: { create: vi.fn() },
      };
      const result = new OperationsService({
        withdrawalRequest: {
          findUnique: vi.fn().mockResolvedValue({ id: 'w1', status: from, walletId: 'wallet', amount: 10 }),
        },
        $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
      } as unknown as PrismaService).updateWithdrawal('w1', { status: to });
      if (allowed.has(`${from}->${to}`)) {
        await expect(result).resolves.toMatchObject({ status: to });
        if (to === WithdrawalStatus.REJECTED) expect(tx.sellerWallet.update).toHaveBeenCalled();
      } else {
        await expect(result).rejects.toThrow('Invalid withdrawal transition');
      }
    },
  );

  it('rejects a missing withdrawal', async () => {
    await expect(
      new OperationsService({
        withdrawalRequest: { findUnique: vi.fn().mockResolvedValue(null) },
      } as unknown as PrismaService).updateWithdrawal('missing', { status: WithdrawalStatus.APPROVED }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('OperationsGuard', () => {
  function guard(expected: string | undefined, header?: string) {
    return new OperationsGuard({
      get: () => expected,
    } as unknown as ConfigService).canActivate({
      switchToHttp: () => ({ getRequest: () => ({ header: () => header }) }),
    } as never);
  }

  it('rejects a missing or wrong key and accepts the right key', () => {
    expect(() => guard('secret')).toThrow(UnauthorizedException);
    expect(() => guard('secret', 'nope')).toThrow('Invalid operations key');
    expect(guard('secret', 'secret')).toBe(true);
    expect(() => guard('', '')).toThrow('Invalid operations key');
  });
});

describe('SellerFinanceService', () => {
  it('rejects a seller without a store', async () => {
    await expect(
      new SellerFinanceService({
        store: { findUnique: vi.fn().mockResolvedValue(null) },
      } as unknown as PrismaService).summary('s1'),
    ).rejects.toThrow('Store not found');
  });

  it('rejects an insufficient balance before and inside the transaction', async () => {
    const service = new SellerFinanceService({
      sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: 1000 }) },
      $transaction: vi.fn(),
    } as unknown as PrismaService);
    await expect(
      service.withdraw('s1', { amount: 10000, bankName: 'VCB', accountNumber: '1', accountName: 'An' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const tx = { sellerWallet: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    const racing = new SellerFinanceService({
      sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: 20000 }) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    } as unknown as PrismaService);
    await expect(
      racing.withdraw('s1', { amount: 10000, bankName: 'VCB', accountNumber: '1', accountName: 'An' }),
    ).rejects.toThrow('Insufficient wallet balance');
  });
});
