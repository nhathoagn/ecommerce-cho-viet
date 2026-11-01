import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { OrdersService } from './orders.service.js';

const statuses = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.PACKING,
  OrderStatus.SHIPPING,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUND_REQUESTED,
  OrderStatus.REFUNDED,
] as const;

const next: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  PAID: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PACKING, OrderStatus.CANCELLED],
  PACKING: [OrderStatus.SHIPPING],
  SHIPPING: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  REFUND_REQUESTED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

const cancellable = new Set<OrderStatus>([
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
]);

function item(price: number, quantity: number, stock = 99, storeId = 'store-1', name = 'Ao') {
  return { productId: 'p1', quantity, product: { price, stock, storeId, name } };
}

function orders(prisma: unknown) {
  return new OrdersService(prisma as PrismaService);
}

describe('OrdersService checkout', () => {
  it.each([
    [499999, 30000, 0, 529999],
    [500000, 0, 0, 500000],
    [500001, 0, 0, 500001],
  ])('ships %s as %s', async (subtotal, shipping, discount, total) => {
    const orderCreate = vi.fn().mockResolvedValue({ id: 'o1' });
    const tx = {
      product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      inventoryTransaction: { create: vi.fn() },
      order: { create: orderCreate },
      cartItem: { deleteMany: vi.fn() },
      coupon: { update: vi.fn() },
    };
    await orders({
      address: { findFirst: vi.fn().mockResolvedValue({ recipientName: 'An', phone: '1', line1: '1', district: '1', city: 'HN' }) },
      cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: [item(subtotal, 1)] }) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).checkout('u1', { addressId: 'a1' });
    expect(orderCreate.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({ shippingAmount: expect.anything(), discountAmount: expect.anything(), totalAmount: expect.anything() }),
    );
    const data = orderCreate.mock.calls[0]?.[0].data;
    expect(Number(data.shippingAmount)).toBe(shipping);
    expect(Number(data.discountAmount)).toBe(discount);
    expect(Number(data.totalAmount)).toBe(total);
  });

  it('rejects a foreign address, an empty cart, and two stores', async () => {
    await expect(
      orders({ address: { findFirst: vi.fn().mockResolvedValue(null) } }).checkout('u1', { addressId: 'a1' }),
    ).rejects.toThrow('Shipping address not found');
    await expect(
      orders({
        address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) },
        cart: { findUnique: vi.fn().mockResolvedValue(null) },
      }).checkout('u1', { addressId: 'a1' }),
    ).rejects.toThrow('Cart is empty');
    await expect(
      orders({
        address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) },
        cart: {
          findUnique: vi.fn().mockResolvedValue({
            items: [item(1, 1, 5, 'a'), item(1, 1, 5, 'b')],
          }),
        },
      }).checkout('u1', { addressId: 'a1' }),
    ).rejects.toThrow('Checkout supports one store at a time');
  });

  it('rejects insufficient stock before and inside the transaction', async () => {
    await expect(
      orders({
        address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) },
        cart: { findUnique: vi.fn().mockResolvedValue({ items: [item(10, 3, 1)] }) },
      }).checkout('u1', { addressId: 'a1' }),
    ).rejects.toThrow('Insufficient stock for Ao');
    const tx = { product: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    await expect(
      orders({
        address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) },
        cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: [item(10, 1, 5)] }) },
        $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
      }).checkout('u1', { addressId: 'a1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sums two lines and copies the address without the user id', async () => {
    const orderCreate = vi.fn().mockResolvedValue({ id: 'o1' });
    const tx = {
      product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      inventoryTransaction: { create: vi.fn() },
      order: { create: orderCreate },
      cartItem: { deleteMany: vi.fn() },
      coupon: { update: vi.fn() },
    };
    await orders({
      address: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'a1',
          userId: 'u1',
          recipientName: 'An',
          phone: '1',
          line1: '1',
          line2: null,
          ward: null,
          district: '1',
          city: 'HN',
          postalCode: null,
        }),
      },
      cart: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'c1',
          items: [
            { productId: 'p1', quantity: 2, product: { price: 10000, stock: 5, storeId: 's', name: 'A' } },
            { productId: 'p2', quantity: 1, product: { price: 5000, stock: 5, storeId: 's', name: 'B' } },
          ],
        }),
      },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).checkout('u1', { addressId: 'a1' });
    const data = orderCreate.mock.calls[0]?.[0].data;
    expect(Number(data.subtotal)).toBe(25000);
    expect(Number(data.shippingAmount)).toBe(30000);
    expect(Number(data.totalAmount)).toBe(55000);
    expect(data.shippingAddress).not.toHaveProperty('userId');
    expect(data.code).toMatch(/^CV-/);
  });

  it.each(statuses.flatMap((from) => statuses.map((to) => [from, to] as const)))(
    'seller %s to %s',
    async (from, to) => {
      const allowed = next[from].includes(to);
      const result = orders({
        order: {
          findFirst: vi.fn().mockResolvedValue({ id: 'o1', status: from, items: [] }),
          update: vi.fn().mockResolvedValue({ status: to }),
        },
        $transaction: async (fn: (tx: {
          product: { update: ReturnType<typeof vi.fn> };
          inventoryTransaction: { create: ReturnType<typeof vi.fn> };
          order: { update: ReturnType<typeof vi.fn> };
        }) => unknown) =>
          fn({
            product: { update: vi.fn().mockResolvedValue({ stock: 1 }) },
            inventoryTransaction: { create: vi.fn() },
            order: { update: vi.fn().mockResolvedValue({ status: to }) },
          }),
      }).sellerUpdate('seller', 'o1', { status: to });
      if (allowed) await expect(result).resolves.toMatchObject({ status: to });
      else await expect(result).rejects.toThrow(`Invalid transition ${from} → ${to}`);
    },
  );
  it.each(statuses)('buyer cancel from %s', async (status) => {
    const service = orders({
      order: {
        findFirst: vi.fn().mockResolvedValue({ id: 'o1', status, items: [{ productId: 'p1', quantity: 2 }] }),
        update: vi.fn(),
      },
      $transaction: async (fn: (tx: unknown) => unknown) =>
        fn({
          product: { update: vi.fn().mockResolvedValue({ stock: 4 }) },
          inventoryTransaction: { create: vi.fn() },
          order: { update: vi.fn().mockResolvedValue({ status: OrderStatus.CANCELLED }) },
        }),
    });
    const result = service.cancel('u1', 'o1');
    if (cancellable.has(status)) await expect(result).resolves.toMatchObject({ status: OrderStatus.CANCELLED });
    else await expect(result).rejects.toThrow('Order can no longer be cancelled');
  });

  it('does not cancel another buyer order', async () => {
    await expect(
      orders({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).cancel('u1', 'o1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });


  it('requires a store and exactly one discount type', async () => {
    await expect(
      orders({ store: { findUnique: vi.fn().mockResolvedValue(null) } }).createCoupon('s1', { code: 'sale' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const create = vi.fn();
    await expect(
      orders({ store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) }, coupon: { create } }).createCoupon(
        's1',
        { code: 'sale', percentOff: 10, fixedAmountOff: 1 },
      ),
    ).rejects.toThrow('Choose percent or fixed discount');
    await orders({
      store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) },
      coupon: { create },
    }).createCoupon('s1', { code: '  sale ', percentOff: 10 });
    expect(create.mock.calls[0]?.[0].data.code).toBe('SALE');
  });

  it('scopes buyer and seller order lists', async () => {
    const findMany = vi.fn();
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = orders({ order: { findMany, findFirst } });
    await service.buyerOrders('u1');
    await service.sellerOrders('s1');
    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { buyerId: 'u1' } }));
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { store: { sellerId: 's1' } } }),
    );
    await expect(service.buyerOrder('u1', 'missing')).rejects.toThrow('Order not found');
  });
});
