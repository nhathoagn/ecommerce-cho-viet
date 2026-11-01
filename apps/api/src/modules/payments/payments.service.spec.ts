import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, WalletTransactionType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { PaymentsService } from './payments.service.js';

const pending = { id: 'o1', code: 'CV-1', status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, store: { sellerId: 'seller-1' } };

function payments(prisma: unknown) {
  return new PaymentsService(prisma as PrismaService);
}

describe('PaymentsService', () => {
  it('create rejects a missing order and a non-pending order', async () => {
    await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).create('u1', 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      payments({ order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PAID }) } }).create('u1', 'o1'),
    ).rejects.toThrow('Order is not awaiting payment');
  });

  it('create rejects an order that is already paid', async () => {
    await expect(
      payments({
        order: { findFirst: vi.fn().mockResolvedValue(pending) },
        payment: { findUnique: vi.fn().mockResolvedValue({ status: PaymentStatus.SUCCESS }) },
      }).create('u1', 'o1'),
    ).rejects.toThrow('Order already paid');
  });

  it('create parks a PENDING payment and never calls a provider', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'pay', status: PaymentStatus.PENDING });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await payments({
      order: { findFirst: vi.fn().mockResolvedValue(pending) },
      payment: { findUnique: vi.fn().mockResolvedValue(null), upsert },
    }).create('u1', 'o1');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ paymentId: 'pay', status: PaymentStatus.PENDING });
    expect(upsert.mock.calls[0]?.[0].create).toMatchObject({
      orderId: 'o1',
      amount: 10,
      status: PaymentStatus.PENDING,
      resultCode: 0,
    });
    vi.unstubAllGlobals();
  });

  it('confirm refuses an order that is not awaiting payment', async () => {
    await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).confirm('u1', 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      payments({ order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PAID }) } }).confirm('u1', 'o1'),
    ).rejects.toThrow('Order is not awaiting payment');
  });

  it('confirm credits the seller wallet once and moves the order to PAID', async () => {
    const tx = {
      payment: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'pay', status: PaymentStatus.SUCCESS }),
      },
      sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w' }), update: vi.fn() },
      order: { update: vi.fn() },
      walletTransaction: { create: vi.fn() },
    };
    const result = await payments({
      order: { findFirst: vi.fn().mockResolvedValue(pending) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).confirm('u1', 'o1');

    expect(result).toEqual({ id: 'pay', status: PaymentStatus.SUCCESS });
    // The claim is conditional on the payment not being SUCCESS yet: that is what stops a double credit.
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: 'o1', status: { not: PaymentStatus.SUCCESS } } }),
    );
    expect(tx.walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reference: 'ORDER:o1', amount: 10 }) }),
    );
    expect(tx.sellerWallet.update).toHaveBeenCalledTimes(1);
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.PAID }) }),
    );
  });

  it('confirm rejects a second call instead of crediting twice', async () => {
    const tx = {
      payment: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), findUniqueOrThrow: vi.fn() },
      sellerWallet: { upsert: vi.fn(), update: vi.fn() },
      order: { update: vi.fn() },
      walletTransaction: { create: vi.fn() },
    };
    await expect(
      payments({
        order: { findFirst: vi.fn().mockResolvedValue(pending) },
        $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
      }).confirm('u1', 'o1'),
    ).rejects.toThrow('Order already paid');
    expect(tx.sellerWallet.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('status scopes the payment to the buyer', async () => {
    const findFirst = vi.fn();
    await payments({ payment: { findFirst } }).status('u1', 'o1');
    expect(findFirst).toHaveBeenCalledWith({ where: { orderId: 'o1', order: { buyerId: 'u1' } } });
  });

  it('refund needs a successful payment and a valid amount', async () => {
    await expect(
      payments({ payment: { findFirst: vi.fn().mockResolvedValue(null) } }).refund('s1', 'o1'),
    ).rejects.toThrow('Successful payment required');
    await expect(
      payments({ payment: { findFirst: vi.fn().mockResolvedValue({ status: PaymentStatus.PENDING }) } }).refund('s1', 'o1'),
    ).rejects.toThrow('Successful payment required');

    const paid = { id: 'pay', status: PaymentStatus.SUCCESS, amount: 100000, refundedAmount: 40000, order: { code: 'CV-1' } };
    await expect(
      payments({ payment: { findFirst: vi.fn().mockResolvedValue(paid) } }).refund('s1', 'o1', 0),
    ).rejects.toThrow('Invalid refund amount');
    await expect(
      payments({ payment: { findFirst: vi.fn().mockResolvedValue(paid) } }).refund('s1', 'o1', 60001),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refund debits the seller wallet without a provider call', async () => {
    const paid = { id: 'pay', status: PaymentStatus.SUCCESS, amount: 100000, refundedAmount: 40000, order: { code: 'CV-1' } };
    const tx = {
      sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: 100000 }), update: vi.fn() },
      payment: { update: vi.fn() },
      order: { update: vi.fn() },
      walletTransaction: { create: vi.fn().mockResolvedValue({ id: 'wt' }) },
    };
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await payments({
      payment: { findFirst: vi.fn().mockResolvedValue(paid) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).refund('s1', 'o1', 60000);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.refundedAmount).toBe(100000);
    expect(tx.walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: WalletTransactionType.REFUND_DEBIT }) }),
    );
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: PaymentStatus.REFUNDED }) }),
    );
    vi.unstubAllGlobals();
  });

  it('refund refuses when the seller balance is short', async () => {
    const paid = { id: 'pay', status: PaymentStatus.SUCCESS, amount: 100000, refundedAmount: 40000, order: { code: 'CV-1' } };
    const tx = {
      sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: 1 }), update: vi.fn() },
      payment: { update: vi.fn() },
      order: { update: vi.fn() },
      walletTransaction: { create: vi.fn() },
    };
    await expect(
      payments({
        payment: { findFirst: vi.fn().mockResolvedValue(paid) },
        $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
      }).refund('s1', 'o1', 60000),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.payment.update).not.toHaveBeenCalled();
  });
});
