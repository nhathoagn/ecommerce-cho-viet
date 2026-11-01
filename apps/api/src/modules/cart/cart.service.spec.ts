import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { CartService } from './cart.service.js';

function cart(prisma: unknown) {
  return new CartService(prisma as PrismaService);
}

describe('CartService', () => {
  it('creates a cart on get', async () => {
    const upsert = vi.fn();
    await cart({ cart: { upsert } }).get('u1');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, create: { userId: 'u1' } }),
    );
  });

  it('rejects a product that is not active', async () => {
    const upsert = vi.fn();
    await expect(
      cart({
        product: { findFirst: vi.fn().mockResolvedValue(null) },
        cartItem: { upsert },
      }).add('u1', { productId: 'p1', quantity: 1 }),
    ).rejects.toThrow('Product not available');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('looks up only active products', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    await expect(cart({ product: { findFirst } }).add('u1', { productId: 'p1', quantity: 1 })).rejects.toThrow(
      NotFoundException,
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'p1', status: ProductStatus.ACTIVE },
    });
  });

  it('rejects a new line that exceeds stock', async () => {
    await expect(
      cart({
        product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 2 }) },
        cart: { upsert: vi.fn().mockResolvedValue({ id: 'c1' }) },
        cartItem: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
      }).add('u1', { productId: 'p1', quantity: 3 }),
    ).rejects.toThrow('Quantity exceeds available stock');
  });

  it('rejects a merged quantity that exceeds stock', async () => {
    await expect(
      cart({
        product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 5 }) },
        cart: { upsert: vi.fn().mockResolvedValue({ id: 'c1' }) },
        cartItem: { findUnique: vi.fn().mockResolvedValue({ quantity: 4 }), upsert: vi.fn() },
      }).add('u1', { productId: 'p1', quantity: 2 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('stores a new line and a merged line within stock', async () => {
    const upsert = vi.fn();
    const prisma = {
      product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 5 }) },
      cart: { upsert: vi.fn().mockResolvedValue({ id: 'c1' }) },
      cartItem: { findUnique: vi.fn().mockResolvedValue(null), upsert },
    };
    await cart(prisma).add('u1', { productId: 'p1', quantity: 5 });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ quantity: 5 }) }),
    );
  });

  it('rejects an item that is not in the user cart', async () => {
    const update = vi.fn();
    await expect(
      cart({ cartItem: { findFirst: vi.fn().mockResolvedValue(null), update } }).update('u1', 'i1', {
        quantity: 1,
      }),
    ).rejects.toThrow('Cart item not found');
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects an update above stock and accepts one at stock', async () => {
    const update = vi.fn();
    const over = cart({
      cartItem: { findFirst: vi.fn().mockResolvedValue({ product: { stock: 2 } }), update },
    });
    await expect(over.update('u1', 'i1', { quantity: 3 })).rejects.toThrow(
      'Quantity exceeds available stock',
    );
    const ok = cart({
      cartItem: {
        findFirst: vi.fn().mockResolvedValue({ product: { stock: 4 } }),
        update,
      },
      cart: { upsert: vi.fn() },
    });
    await ok.update('u1', 'i1', { quantity: 4 });
    expect(update).toHaveBeenCalledWith({ where: { id: 'i1' }, data: { quantity: 4 } });
  });

  it('removes an owned item and rejects a foreign item', async () => {
    const del = vi.fn();
    await expect(
      cart({ cartItem: { findFirst: vi.fn().mockResolvedValue(null), delete: del } }).remove('u1', 'i1'),
    ).rejects.toThrow('Cart item not found');
    await cart({
      cartItem: { findFirst: vi.fn().mockResolvedValue({ id: 'i1' }), delete: del },
      cart: { upsert: vi.fn() },
    }).remove('u1', 'i1');
    expect(del).toHaveBeenCalledWith({ where: { id: 'i1' } });
  });

  it('clears items only when a cart exists', async () => {
    const deleteMany = vi.fn();
    await cart({ cart: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() }, cartItem: { deleteMany } }).clear(
      'u1',
    );
    expect(deleteMany).not.toHaveBeenCalled();
    await cart({
      cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1' }), upsert: vi.fn() },
      cartItem: { deleteMany },
    }).clear('u1');
    expect(deleteMany).toHaveBeenCalledWith({ where: { cartId: 'c1' } });
  });
});
