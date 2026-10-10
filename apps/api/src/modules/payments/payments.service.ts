import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
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
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly createEndpoint: string;
  private readonly queryEndpoint: string;
  private readonly refundEndpoint: string;
  private readonly redirectUrl: string;
  private readonly ipnUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.partnerCode = config.get<string>('MOMO_PARTNER_CODE') ?? '';
    this.accessKey = config.get<string>('MOMO_ACCESS_KEY') ?? '';
    this.secretKey = config.get<string>('MOMO_SECRET_KEY') ?? '';
    this.createEndpoint = config.get<string>('MOMO_ENDPOINT') ?? '';
    this.queryEndpoint =
      config.get<string>('MOMO_QUERY_ENDPOINT') ??
      'https://test-payment.momo.vn/v2/gateway/api/query';
    this.refundEndpoint =
      config.get<string>('MOMO_REFUND_ENDPOINT') ??
      'https://test-payment.momo.vn/v2/gateway/api/refund';
    this.redirectUrl = config.get<string>('MOMO_REDIRECT_URL') ?? '';
    this.ipnUrl = config.get<string>('MOMO_IPN_URL') ?? '';
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
    if (Number(response.resultCode) !== 0)
      throw new BadRequestException(
        response.message ?? 'MoMo rejected payment request',
      );
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
      include: { order: true },
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
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          resultCode: 0,
          providerTransactionId: String(payload.transId),
          paidAt: new Date(),
        },
      }),
      this.prisma.order.update({
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
      }),
    ]);
    return { resultCode: 0, message: 'Received' };
  }

  async refund(sellerId: string, orderId: string, amount?: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, order: { store: { sellerId } } },
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
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: new Prisma.Decimal(refundedAmount),
          refundedAt: new Date(),
          status:
            refundedAmount >= Number(payment.amount)
              ? PaymentStatus.REFUNDED
              : PaymentStatus.SUCCESS,
        },
      }),
      this.prisma.order.update({
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
      }),
    ]);
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
