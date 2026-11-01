import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { UsersService } from './users.service.js';

function users(prisma: unknown) {
  return new UsersService(prisma as PrismaService);
}

describe('UsersService', () => {
  it('loads a profile without the password hash', async () => {
    const findUniqueOrThrow = vi.fn();
    await users({ user: { findUniqueOrThrow } }).profile('u1');
    expect(findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        select: expect.not.objectContaining({ passwordHash: true }),
      }),
    );
  });

  it('updates only the supplied profile fields', async () => {
    const update = vi.fn();
    await users({ user: { update } }).updateProfile('u1', { name: 'An' });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { name: 'An' } }),
    );
  });

  it('lists addresses for the user', async () => {
    const findMany = vi.fn();
    await users({ address: { findMany } }).addresses('u1');
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('makes the first address the default', async () => {
    const updateMany = vi.fn();
    const create = vi.fn();
    const tx = { address: { count: vi.fn().mockResolvedValue(0), updateMany, create } };
    await users({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).createAddress('u1', {
      recipientName: 'An',
      phone: '0901',
      line1: '1',
      district: '1',
      city: 'HN',
      isDefault: false,
    });
    expect(updateMany).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) }),
    );
  });

  it('does not default a later address', async () => {
    const updateMany = vi.fn();
    const create = vi.fn();
    const tx = { address: { count: vi.fn().mockResolvedValue(2), updateMany, create } };
    await users({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).createAddress('u1', {
      recipientName: 'An',
      phone: '0901',
      line1: '1',
      district: '1',
      city: 'HN',
      isDefault: false,
    });
    expect(updateMany).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: false }) }),
    );
  });

  it('clears the old default when the new address is default', async () => {
    const updateMany = vi.fn();
    const tx = {
      address: { count: vi.fn().mockResolvedValue(2), updateMany, create: vi.fn() },
    };
    await users({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).createAddress('u1', {
      recipientName: 'An',
      phone: '0901',
      line1: '1',
      district: '1',
      city: 'HN',
      isDefault: true,
    });
    expect(updateMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, data: { isDefault: false } });
  });

  it('rejects an address that does not belong to the user', async () => {
    const update = vi.fn();
    const service = users({
      address: { findFirst: vi.fn().mockResolvedValue(null), update },
      $transaction: vi.fn(),
    });
    await expect(service.updateAddress('u1', 'a1', { city: 'HN' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('clears other defaults when updating the default flag', async () => {
    const updateMany = vi.fn();
    const update = vi.fn();
    const tx = { address: { updateMany, update } };
    await users({
      address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) },
      $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
    }).updateAddress('u1', 'a1', { isDefault: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', id: { not: 'a1' } },
      data: { isDefault: false },
    });
  });

  it('deletes a non-default address without promoting another', async () => {
    const del = vi.fn();
    const update = vi.fn();
    await users({
      address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1', isDefault: false }), delete: del, update },
    }).deleteAddress('u1', 'a1');
    expect(del).toHaveBeenCalledWith({ where: { id: 'a1' } });
    expect(update).not.toHaveBeenCalled();
  });

  it('promotes the newest remaining address after deleting the default', async () => {
    const update = vi.fn();
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: 'a1', isDefault: true })
      .mockResolvedValueOnce({ id: 'b2' });
    await users({ address: { findFirst, delete: vi.fn(), update } }).deleteAddress('u1', 'a1');
    expect(update).toHaveBeenCalledWith({ where: { id: 'b2' }, data: { isDefault: true } });
  });

  it('does not promote an address when the deleted default was the last one', async () => {
    const update = vi.fn();
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: 'a1', isDefault: true })
      .mockResolvedValueOnce(null);
    await expect(
      users({ address: { findFirst, delete: vi.fn(), update } }).deleteAddress('u1', 'a1'),
    ).resolves.toEqual({ success: true });
    expect(update).not.toHaveBeenCalled();
  });
});
