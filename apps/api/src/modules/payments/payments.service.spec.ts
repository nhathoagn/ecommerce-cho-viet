import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { PaymentsService } from './payments.service.js';

const secret = 'test-secret';

function payments(prisma: unknown) {
  return new PaymentsService(prisma as PrismaService, {
    get: (key: string) => (key === 'MOMO_SECRET_KEY' ? secret : 'value'),
  } as unknown as ConfigService);
}

function sign(raw: string) {
  return createHmac('sha256', secret).update(raw).digest('hex');
}

describe('PaymentsService', () => {
  it('rejects a missing order and a non-pending order', async () => {
    await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).create('u1', 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      payments({
        order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PAID }) },
      }).create('u1', 'o1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PACKING,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUND_REQUESTED,
    OrderStatus.REFUNDED,
  ])('rejects create while the order is %s', async (status) => {
    await expect(
      payments({ order: { findFirst: vi.fn().mockResolvedValue({ status }) } }).create('u1', 'o1'),
    ).rejects.toThrow('Order is not awaiting payment');
  });

  it('rejects an already successful payment and a MoMo rejection', async () => {
    await expect(
      payments({
        order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) },
        payment: { findUnique: vi.fn().mockResolvedValue({ status: PaymentStatus.SUCCESS }) },
      }).create('u1', 'o1'),
    ).rejects.toThrow('Order already paid');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ resultCode: 1001, message: 'rejected' }) }),
    );
    await expect(
      payments({
        order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) },
        payment: { findUnique: vi.fn().mockResolvedValue(null) },
      }).create('u1', 'o1'),
    ).rejects.toThrow('rejected');
    vi.unstubAllGlobals();
  });

  it('creates a local payment when MoMo keys are empty', async () => {
    const upsertWallet = vi.fn().mockResolvedValue({ id: 'w1' });
    const upsertPayment = vi.fn().mockResolvedValue({ id: 'pay', payUrl: 'http://localhost:5173/payment/result?orderId=o1' });
    const service = new PaymentsService(
      {
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1', code: 'CV', status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, storeId: 'st1' }) },
        payment: { findUnique: vi.fn().mockResolvedValue(null), upsert: upsertPayment },
      } as unknown as PrismaService,
      { get: () => '' } as unknown as ConfigService,
    );
    const result = await service.create('u1', 'o1');
    expect(result.payUrl).toContain('/payment/result?orderId=o1');
    // Nothing is charged until the buyer confirms: no wallet write, payment stays pending.
    expect(upsertWallet).not.toHaveBeenCalled();
    expect(upsertPayment.mock.calls[0]?.[0].create.status).toBe(PaymentStatus.PENDING);
  });

  it('skips MoMo when DEV_FORCE_LOCAL_PAYMENT is on, even with keys set', async () => {
    const upsertPayment = vi.fn().mockResolvedValue({ id: 'pay', payUrl: 'http://localhost:5173/payment/result?orderId=o1' });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const service = new PaymentsService(
      {
        order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1', code: 'CV', status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, storeId: 'st1' }) },
        payment: { findUnique: vi.fn().mockResolvedValue(null), upsert: upsertPayment },
      } as unknown as PrismaService,
      {
        get: (key: string) =>
          key === 'DEV_FORCE_LOCAL_PAYMENT' ? true : key === 'MOMO_SECRET_KEY' ? secret : 'value',
      } as unknown as ConfigService,
    );
    const result = await service.create('u1', 'o1');
    expect(result.payUrl).toContain('/payment/result?orderId=o1');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('rejects an unavailable gateway', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    await expect(
      payments({
        order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) },
        payment: { findUnique: vi.fn().mockResolvedValue(null) },
      }).create('u1', 'o1'),
    ).rejects.toThrow('MoMo gateway unavailable');
    vi.unstubAllGlobals();
  });

  it('reuses an existing request id', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'pay', payUrl: 'https://pay' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ resultCode: 0, payUrl: 'https://pay' }) }),
    );
    const result = await payments({
      order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) },
      payment: { findUnique: vi.fn().mockResolvedValue({ status: PaymentStatus.PENDING, requestId: 'req-1' }), upsert },
    }).create('u1', 'o1');
    expect(result.requestId).toBe('req-1');
    vi.unstubAllGlobals();
  });

  it('scopes status and rejects a missing query payment', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = payments({ payment: { findFirst } });
    await service.status('u1', 'o1');
    expect(findFirst).toHaveBeenCalledWith({ where: { orderId: 'o1', order: { buyerId: 'u1' } } });
    await expect(service.query('u1', 'o1')).rejects.toThrow('Payment not found');
  });

  it('rejects a bad IPN signature and a mismatched payment', async () => {
    await expect(
      payments({}).handleIpn({
        partnerCode: 'value',
        orderId: 'o1',
        requestId: 'r',
        amount: 10,
        orderInfo: 'x',
        orderType: 'x',
        transId: 1,
        resultCode: 0,
        message: 'ok',
        payType: 'qr',
        responseTime: 1,
        extraData: '',
        signature: 'bad',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      payments({ payment: { findUnique: vi.fn().mockResolvedValue(null) } }).handleIpn(signedIpn()),
    ).rejects.toThrow('Payment does not match order');
  });

  it('acks an already successful IPN without crediting again', async () => {
    const update = vi.fn();
    await expect(
      payments({
        payment: {
          findUnique: vi.fn().mockResolvedValue({
            requestId: 'r',
            amount: 10,
            status: PaymentStatus.SUCCESS,
          }),
          update,
        },
      }).handleIpn(signedIpn()),
    ).resolves.toEqual({ resultCode: 0, message: 'Received' });
    expect(update).not.toHaveBeenCalled();
  });

  it('marks a failed IPN and credits a successful one', async () => {
    const update = vi.fn();
    const failed = signedIpn();
    failed.resultCode = 1006;
    failed.signature = signatureFor(failed);
    await payments({
      payment: {
        findUnique: vi.fn().mockResolvedValue({ id: 'pay', requestId: 'r', amount: 10, status: PaymentStatus.PENDING }),
        update,
      },
    }).handleIpn(failed);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: PaymentStatus.FAILED, resultCode: 1006 } }),
    );
  });

  it('rejects a refund without a successful payment or an invalid amount', async () => {
    await expect(payments({ payment: { findFirst: vi.fn().mockResolvedValue(null) } }).refund('s1', 'o1')).rejects.toThrow(
      'Successful payment required',
    );
    const payment = {
      status: PaymentStatus.SUCCESS,
      providerTransactionId: 'tx',
      amount: 100000,
      refundedAmount: 40000,
      order: { code: 'CV', store: { sellerId: 's1' } },
    };
    await expect(
      payments({ payment: { findFirst: vi.fn().mockResolvedValue(payment) } }).refund('s1', 'o1', 70000),
    ).rejects.toThrow('Invalid refund amount');
    await expect(
      payments({ payment: { findFirst: vi.fn().mockResolvedValue(payment) } }).refund('s1', 'o1', 0),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function signedIpn() {
  const payload = {
    partnerCode: 'value',
    orderId: 'o1',
    requestId: 'r',
    amount: 10,
    orderInfo: 'x',
    orderType: 'x',
    transId: 1,
    resultCode: 0,
    message: 'ok',
    payType: 'qr',
    responseTime: 1,
    extraData: '',
    signature: '',
  };
  payload.signature = signatureFor(payload);
  return payload;
}

function signatureFor(payload: ReturnType<typeof signedIpn>) {
  const raw = `accessKey=value&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&payType=${payload.payType}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`;
  return sign(raw);
}
