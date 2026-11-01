import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { CatalogService, SellerCatalogService } from './catalog.service.js';

function seller(prisma: unknown) {
  return new SellerCatalogService(prisma as PrismaService);
}

describe('SellerCatalogService', () => {
  it.each([
    ['Áo Dài Việt', 'ao-dai-viet'],
    ['  Cà phê  ', 'ca-phe'],
    ['Hello World', 'hello-world'],
    ['SKU-01', 'sku-01'],
    ['!!!', 'item'],
    ['Điện tử', 'dien-tu'],
  ])('slugs %j to %s', async (name, slug) => {
    const create = vi.fn();
    await seller({
      store: {
        findUnique: vi.fn().mockResolvedValue(null),
        create,
      },
    }).createStore('s1', { name });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug }) }),
    );
  });

  it('suffixes a slug that already exists', async () => {
    const create = vi.fn();
    await seller({
      store: {
        findUnique: vi.fn(async ({ where }: { where: { sellerId?: string; slug?: string } }) => {
          if (where.sellerId) return null;
          return where.slug === 'ao-dai' ? { id: 'old' } : null;
        }),
        create,
      },
    }).createStore('s1', { name: 'Áo Dài' });
    expect(create.mock.calls[0]?.[0].data.slug).toBe('ao-dai-1');
  });

  it('rejects a second store and creates the first with description', async () => {
    const create = vi.fn();
    await expect(
      seller({ store: { findUnique: vi.fn().mockResolvedValue({ id: 's' }) } }).createStore('s1', {
        name: 'Shop',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await seller({
      store: { findUnique: vi.fn().mockResolvedValue(null), create },
    }).createStore('s1', { name: 'Shop', description: 'Mo ta', logoKey: 'logo' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: 'Mo ta', logoKey: 'logo' }),
      }),
    );
  });

  it('returns null from getStore and throws from updateStore when missing', async () => {
    const service = seller({ store: { findUnique: vi.fn().mockResolvedValue(null) } });
    await expect(service.getStore('s1')).resolves.toBeNull();
    await expect(service.updateStore('s1', { name: 'X' })).rejects.toThrow('Store not found');
  });

  it('rejects a missing parent category', async () => {
    await expect(
      seller({ category: { findUnique: vi.fn().mockResolvedValue(null) } }).createCategory({
        name: 'Ao',
        parentId: 'p1',
      }),
    ).rejects.toThrow('Parent category not found');
  });

  it('rejects a duplicate sku and records initial stock', async () => {
    const inventory = vi.fn();
    const productCreate = vi.fn().mockResolvedValue({ id: 'p1' });
    await expect(
      seller({
        store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) },
        product: { findUnique: vi.fn().mockResolvedValue({ id: 'old' }) },
      }).createProduct('s1', { name: 'Ao', sku: 'SKU', price: 1 }),
    ).rejects.toThrow('SKU already exists');

    const tx = { product: { create: productCreate }, inventoryTransaction: { create: inventory } };
    await seller({
      store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) },
      product: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).createProduct('s1', { name: 'Ao', sku: 'SKU', price: 1, stock: 5 });
    expect(inventory).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'INITIAL', quantity: 5, before: 0, after: 5 }),
      }),
    );
  });

  it('forces out of stock when an active product is created with zero stock', async () => {
    const productCreate = vi.fn().mockResolvedValue({ id: 'p1' });
    const tx = { product: { create: productCreate }, inventoryTransaction: { create: vi.fn() } };
    await seller({
      store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) },
      product: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).createProduct('s1', { name: 'Ao', sku: 'SKU', price: 1, stock: 0, status: ProductStatus.ACTIVE });
    expect(productCreate.mock.calls[0]?.[0].data.status).toBe(ProductStatus.OUT_OF_STOCK);
  });

  it('rejects a stock change on product update', async () => {
    await expect(
      seller({
        product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 1 }) },
      }).updateProduct('s1', 'p1', { stock: 4 }),
    ).rejects.toThrow('Use the inventory adjustment endpoint to change stock');
  });

  it('replaces images and rejects a missing owned product', async () => {
    const update = vi.fn();
    await seller({
      product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 1 }), update },
    }).updateProduct('s1', 'p1', { images: [{ objectKey: 'a' }] });
    expect(update.mock.calls[0]?.[0].data.images).toEqual({
      deleteMany: {},
      create: [{ objectKey: 'a' }],
    });
    await expect(
      seller({ product: { findFirst: vi.fn().mockResolvedValue(null) } }).updateProduct('s1', 'p1', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an adjustment below zero and marks active stock zero as out of stock', async () => {
    const tx = {
      product: {
        findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 2, status: ProductStatus.ACTIVE }),
        update: vi.fn().mockResolvedValue({}),
      },
      inventoryTransaction: { create: vi.fn() },
    };
    await expect(
      seller({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).adjustInventory('s1', 'p1', {
        quantity: -3,
      }),
    ).rejects.toThrow('Insufficient stock');

    tx.product.findFirst.mockResolvedValue({ id: 'p1', stock: 2, status: ProductStatus.ACTIVE });
    await seller({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).adjustInventory('s1', 'p1', {
      quantity: -2,
    });
    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: 0, status: ProductStatus.OUT_OF_STOCK } }),
    );
  });

  it('reactivates an out of stock product and leaves a draft status alone', async () => {
    const update = vi.fn().mockResolvedValue({});
    const tx = {
      product: {
        findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 0, status: ProductStatus.OUT_OF_STOCK }),
        update,
      },
      inventoryTransaction: { create: vi.fn() },
    };
    await seller({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).adjustInventory('s1', 'p1', {
      quantity: 4,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: 4, status: ProductStatus.ACTIVE } }),
    );
    tx.product.findFirst.mockResolvedValue({ id: 'p1', stock: 1, status: ProductStatus.DRAFT });
    await seller({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).adjustInventory('s1', 'p1', {
      quantity: 2,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: 3, status: ProductStatus.DRAFT } }),
    );
  });

  it('deletes an owned product', async () => {
    const del = vi.fn();
    await expect(
      seller({
        product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1' }), delete: del },
      }).removeProduct('s1', 'p1'),
    ).resolves.toEqual({ deleted: true });
  });
});

describe('CatalogService', () => {
  it('lists root categories and active products', async () => {
    const categories = vi.fn();
    const products = vi.fn();
    const service = new CatalogService({
      category: { findMany: categories },
      product: { findMany: products, findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService);
    await service.categories();
    expect(categories).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parentId: null }, orderBy: { name: 'asc' } }),
    );
    await service.products({});
    expect(products).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: ProductStatus.ACTIVE }, orderBy: { createdAt: 'desc' } }),
    );
    await service.products({ search: '' });
    expect(products.mock.calls[1]?.[0].where).toEqual({ status: ProductStatus.ACTIVE });
    await service.products({ search: 'ao', category: 'ao-dai', store: 'shop-a' });
    expect(products.mock.calls[2]?.[0].where).toEqual({
      status: ProductStatus.ACTIVE,
      name: { contains: 'ao', mode: 'insensitive' },
      category: { slug: 'ao-dai' },
      store: { slug: 'shop-a' },
    });
    await expect(service.product('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
