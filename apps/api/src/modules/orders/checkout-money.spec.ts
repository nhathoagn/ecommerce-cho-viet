import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { OrdersService } from './orders.service.js';

function checkout(subtotal: number, coupon: unknown) {
  const orderCreate = vi.fn().mockResolvedValue({ id: 'o1' });
  const tx = {
    product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    inventoryTransaction: { create: vi.fn() },
    order: { create: orderCreate },
    cartItem: { deleteMany: vi.fn() },
    coupon: { update: vi.fn() },
  };
  return {
    orderCreate,
    run: new OrdersService({
      address: { findFirst: vi.fn().mockResolvedValue({ recipientName: 'An', phone: '1', line1: '1', district: '1', city: 'HN' }) },
      cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: [{ productId: 'p1', quantity: 1, product: { price: subtotal, stock: 5, storeId: 'store-1', name: 'Ao' } }] }) },
      coupon: { findUnique: vi.fn().mockResolvedValue(coupon) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    } as unknown as PrismaService).checkout('u1', { addressId: 'a1', couponCode: coupon ? 'sale' : undefined }),
  };
}

describe('checkout money', () => {
  it.each([
    [100000, { percentOff: 10, fixedAmountOff: null, storeId: 'store-1', active: true, expiresAt: null, maxUses: null, usedCount: 0, minOrderAmount: 0, code: 'SALE', id: 'c' }, 30000, 10000, 120000],
    [500000, { percentOff: 10, fixedAmountOff: null, storeId: 'store-1', active: true, expiresAt: null, maxUses: null, usedCount: 0, minOrderAmount: 0, code: 'SALE', id: 'c' }, 0, 50000, 450000],
    [100000, { percentOff: null, fixedAmountOff: 20000, storeId: 'store-1', active: true, expiresAt: null, maxUses: null, usedCount: 0, minOrderAmount: 0, code: 'SALE', id: 'c' }, 30000, 20000, 110000],
    [100000, { percentOff: null, fixedAmountOff: 999999, storeId: 'store-1', active: true, expiresAt: null, maxUses: null, usedCount: 0, minOrderAmount: 0, code: 'SALE', id: 'c' }, 30000, 100000, 30000],
    [80000, { percentOff: 100, fixedAmountOff: null, storeId: 'store-1', active: true, expiresAt: null, maxUses: null, usedCount: 0, minOrderAmount: 0, code: 'SALE', id: 'c' }, 30000, 80000, 30000],
  ])('discounts subtotal %s', async (subtotal, coupon, shipping, discount, total) => {
    const { run, orderCreate } = checkout(subtotal, coupon);
    await run;
    const data = orderCreate.mock.calls[0]?.[0].data;
    expect(Number(data.shippingAmount)).toBe(shipping);
    expect(Number(data.discountAmount)).toBe(discount);
    expect(Number(data.totalAmount)).toBe(total);
  });
});
