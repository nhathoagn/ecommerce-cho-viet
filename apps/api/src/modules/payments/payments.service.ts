import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma, WalletTransactionType } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';

interface MomoIpn {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly createEndpoint: string;
  private readonly queryEndpoint: string;
  private readonly refundEndpoint: string;
  private readonly redirectUrl: string;
  private readonly ipnUrl: string;
  private readonly webUrl: string;
  private readonly forceLocalPayment: boolean;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.partnerCode = config.get<string>('MOMO_PARTNER_CODE') ?? '';
    this.accessKey = config.get<string>('MOMO_ACCESS_KEY') ?? '';
    this.secretKey = config.get<string>('MOMO_SECRET_KEY') ?? '';
    this.createEndpoint = config.get<string>('MOMO_ENDPOINT') ?? '';
    this.webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:5173';
    this.queryEndpoint =
      config.get<string>('MOMO_QUERY_ENDPOINT') ??
      'https://test-payment.momo.vn/v2/gateway/api/query';
    this.refundEndpoint =
      config.get<string>('MOMO_REFUND_ENDPOINT') ??
      'https://test-payment.momo.vn/v2/gateway/api/refund';
    this.redirectUrl = config.get<string>('MOMO_REDIRECT_URL') ?? '';
    this.ipnUrl = config.get<string>('MOMO_IPN_URL') ?? '';
    this.forceLocalPayment = config.get<boolean>('DEV_FORCE_LOCAL_PAYMENT') === true;
  }

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
    const requestId = existing?.requestId ?? randomUUID();
    const amount = Number(order.totalAmount);
    if (
      this.forceLocalPayment ||
      !this.partnerCode ||
      !this.accessKey ||
      !this.secretKey
    ) {
      return this.createLocalPayment(order, requestId, amount);
    }
    const orderInfo = `Thanh toan don hang ${order.code}`;
    const extraData = '';
    const requestType = 'captureWallet';
    const raw = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const body = {
      partnerCode: this.partnerCode,
      partnerName: 'Cho Viet',
      storeId: 'ChoVietMarketplace',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature: this.sign(raw),
    };
    const response = await this.post(this.createEndpoint, body);
    if (Number(response.resultCode) !== 0) {
      this.logger.warn(
        `MoMo create declined resultCode=${String(response.resultCode)} message=${String(response.message)}`,
      );
      throw new BadRequestException('MoMo rejected payment request');
    }
    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        requestId,
        amount: new Prisma.Decimal(amount),
        payUrl: String(response.payUrl),
        resultCode: 0,
      },
      update: { payUrl: String(response.payUrl), resultCode: 0 },
    });
    return { paymentId: payment.id, payUrl: payment.payUrl, requestId };
  }

  /** Dev/sandbox with no MoMo keys: park the payment as pending, let the buyer confirm. */
  private async createLocalPayment(
    order: { id: string; code: string; storeId: string },
    requestId: string,
    amount: number,
  ) {
    const payUrl = `${this.webUrl.replace(/\/$/, '')}/payment/result?orderId=${order.id}`;
    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        requestId,
        amount: new Prisma.Decimal(amount),
        payUrl,
        resultCode: 0,
        status: PaymentStatus.PENDING,
      },
      update: { payUrl, resultCode: 0, status: PaymentStatus.PENDING, paidAt: null },
    });
    return { paymentId: payment.id, payUrl: payment.payUrl, requestId };
  }

  /**
   * Confirms a local (no-MoMo) payment. Only available when MoMo is not configured
   * or DEV_FORCE_LOCAL_PAYMENT is on, so a real deployment can never mark an order
   * paid without the gateway.
   */
  async confirmLocal(userId: string, orderId: string) {
    if (!this.forceLocalPayment && this.partnerCode && this.accessKey && this.secretKey)
      throw new ForbiddenException('Local payment confirmation is disabled');
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: { store: { select: { sellerId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT)
      throw new ConflictException('Order is not awaiting payment');
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.SUCCESS)
      throw new ConflictException('Order already paid');

    const amount = Number(order.totalAmount);
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId: order.store.sellerId },
        create: { sellerId: order.store.sellerId },
        update: {},
      });
      const updated = await tx.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date(), resultCode: 0 },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          statusHistory: {
            create: { status: OrderStatus.PAID, note: 'Local payment confirmed in dev' },
          },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          reference: `ORDER:${orderId}`,
          type: WalletTransactionType.ORDER_CREDIT,
          amount: new Prisma.Decimal(amount),
          description: `Payment for order ${order.code}`,
        },
      });
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { increment: amount } },
      });
      return updated;
    });
  }

  status(userId: string, orderId: string) {
    return this.prisma.payment.findFirst({
      where: { orderId, order: { buyerId: userId } },
    });
  }

  async query(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, order: { buyerId: userId } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const requestId = randomUUID();
    const raw = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`;
    return this.post(this.queryEndpoint, {
      partnerCode: this.partnerCode,
      requestId,
      orderId,
      lang: 'vi',
      signature: this.sign(raw),
    });
  }

  async handleIpn(payload: MomoIpn) {
    if (!this.verifyIpn(payload))
      throw new UnauthorizedException('Invalid MoMo signature');
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: payload.orderId },
      include: { order: { include: { store: true } } },
    });
    if (
      !payment ||
      payment.requestId !== payload.requestId ||
      Number(payment.amount) !== Number(payload.amount)
    )
      throw new BadRequestException('Payment does not match order');
    if (payment.status === PaymentStatus.SUCCESS)
      return { resultCode: 0, message: 'Received' };
    if (payload.resultCode !== 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, resultCode: payload.resultCode },
      });
      return { resultCode: 0, message: 'Received' };
    }
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId: payment.order.store.sellerId },
        create: { sellerId: payment.order.store.sellerId },
        update: {},
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          resultCode: 0,
          providerTransactionId: String(payload.transId),
          paidAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
          statusHistory: {
            create: {
              status: OrderStatus.PAID,
              note: 'MoMo payment confirmed',
            },
          },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          reference: `ORDER:${payment.orderId}`,
          type: WalletTransactionType.ORDER_CREDIT,
          amount: payment.amount,
          description: `Payment for order ${payment.order.code}`,
        },
      });
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { increment: payment.amount } },
      });
    });
    return { resultCode: 0, message: 'Received' };
  }

  async refund(sellerId: string, orderId: string, amount?: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, order: { store: { sellerId } } },
      include: { order: { include: { store: true } } },
    });
    if (
      !payment ||
      payment.status !== PaymentStatus.SUCCESS ||
      !payment.providerTransactionId
    )
      throw new BadRequestException('Successful payment required');
    const refundAmount = amount ?? Number(payment.amount);
    if (
      refundAmount <= 0 ||
      refundAmount > Number(payment.amount) - Number(payment.refundedAmount)
    )
      throw new BadRequestException('Invalid refund amount');
    const requestId = randomUUID();
    const transId = payment.providerTransactionId;
    const description = `Refund order ${orderId}`;
    const raw = `accessKey=${this.accessKey}&amount=${refundAmount}&description=${description}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}&transId=${transId}`;
    const response = await this.post(this.refundEndpoint, {
      partnerCode: this.partnerCode,
      orderId,
      requestId,
      amount: refundAmount,
      transId,
      lang: 'vi',
      description,
      signature: this.sign(raw),
    });
    if (Number(response.resultCode) !== 0)
      throw new BadRequestException(response.message ?? 'Refund rejected');
    const refundedAmount = Number(payment.refundedAmount) + refundAmount;
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId }, create: { sellerId }, update: {},
      });
      if (Number(wallet.availableBalance) < refundAmount)
        throw new BadRequestException('Insufficient seller balance for refund');
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: new Prisma.Decimal(refundedAmount),
          refundedAt: new Date(),
          status:
            refundedAmount >= Number(payment.amount)
              ? PaymentStatus.REFUNDED
              : PaymentStatus.SUCCESS,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status:
            refundedAmount >= Number(payment.amount)
              ? OrderStatus.REFUNDED
              : OrderStatus.REFUND_REQUESTED,
          statusHistory: {
            create: {
              status:
                refundedAmount >= Number(payment.amount)
                  ? OrderStatus.REFUNDED
                  : OrderStatus.REFUND_REQUESTED,
              note: 'MoMo refund processed',
            },
          },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          reference: `REFUND:${orderId}:${requestId}`,
          type: WalletTransactionType.REFUND_DEBIT,
          amount: new Prisma.Decimal(-refundAmount),
          description: `Refund for order ${payment.order.code}`,
        },
      });
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { decrement: new Prisma.Decimal(refundAmount) } },
      });
    });
    return response;
  }

  private verifyIpn(payload: MomoIpn) {
    const raw = `accessKey=${this.accessKey}&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&payType=${payload.payType}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`;
    const expected = Buffer.from(this.sign(raw));
    const actual = Buffer.from(payload.signature ?? '');
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private sign(raw: string) {
    return createHmac('sha256', this.secretKey).update(raw).digest('hex');
  }
  private async post(url: string, body: object) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw new BadRequestException('MoMo gateway unavailable');
    return result;
  }
}
