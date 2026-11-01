import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  WalletTransactionType,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Demo checkout. There is no payment provider: the buyer scans the app's own QR,
 * presses confirm, and the order turns PAID. Nothing leaves this machine.
 */
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT)
      throw new ConflictException('Order is not awaiting payment');
    const existing = await this.prisma.payment.findUnique({
      where: { orderId },
    });
    if (existing?.status === PaymentStatus.SUCCESS)
      throw new ConflictException('Order already paid');

    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        requestId: randomUUID(),
        amount: order.totalAmount,
        resultCode: 0,
        status: PaymentStatus.PENDING,
      },
      update: { resultCode: 0, status: PaymentStatus.PENDING, paidAt: null },
    });
    return { paymentId: payment.id, status: payment.status };
  }

  /**
   * Marks the order paid. The claim runs inside the transaction, so two confirms
   * racing on the same order credit the seller wallet exactly once.
   */
  async confirm(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: { store: { select: { sellerId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT)
      throw new ConflictException('Order is not awaiting payment');

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { orderId, status: { not: PaymentStatus.SUCCESS } },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date(), resultCode: 0 },
      });
      if (claimed.count === 0) throw new ConflictException('Order already paid');

      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId: order.store.sellerId },
        create: { sellerId: order.store.sellerId },
        update: {},
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          statusHistory: {
            create: { status: OrderStatus.PAID, note: 'Buyer confirmed the transfer' },
          },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          reference: `ORDER:${orderId}`,
          type: WalletTransactionType.ORDER_CREDIT,
          amount: order.totalAmount,
          description: `Payment for order ${order.code}`,
        },
      });
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { increment: order.totalAmount } },
      });
      const payment = await tx.payment.findUniqueOrThrow({ where: { orderId } });
      return { id: payment.id, status: payment.status };
    });
  }

  status(userId: string, orderId: string) {
    return this.prisma.payment.findFirst({
      where: { orderId, order: { buyerId: userId } },
    });
  }

  /** Local refund: debits the seller wallet and moves the order along. No provider call. */
  async refund(sellerId: string, orderId: string, amount?: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, order: { store: { sellerId } } },
      include: { order: true },
    });
    if (!payment || payment.status !== PaymentStatus.SUCCESS)
      throw new BadRequestException('Successful payment required');
    const refundAmount = amount ?? Number(payment.amount);
    if (
      refundAmount <= 0 ||
      refundAmount > Number(payment.amount) - Number(payment.refundedAmount)
    )
      throw new BadRequestException('Invalid refund amount');

    const refundedAmount = Number(payment.refundedAmount) + refundAmount;
    const fully = refundedAmount >= Number(payment.amount);
    const reference = `REFUND:${orderId}:${refundAmount}`;

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId },
        create: { sellerId },
        update: {},
      });
      if (Number(wallet.availableBalance) < refundAmount)
        throw new BadRequestException('Insufficient seller balance for refund');

      const debited = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          reference,
          type: WalletTransactionType.REFUND_DEBIT,
          amount: new Prisma.Decimal(-refundAmount),
          description: `Refund for order ${payment.order.code}`,
        },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: new Prisma.Decimal(refundedAmount),
          refundedAt: new Date(),
          status: fully ? PaymentStatus.REFUNDED : PaymentStatus.SUCCESS,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: fully ? OrderStatus.REFUNDED : OrderStatus.REFUND_REQUESTED,
          statusHistory: {
            create: {
              status: fully ? OrderStatus.REFUNDED : OrderStatus.REFUND_REQUESTED,
              note: 'Local refund recorded',
            },
          },
        },
      });
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { decrement: new Prisma.Decimal(refundAmount) } },
      });
      return { id: debited.id, refundedAmount };
    });
  }
}
