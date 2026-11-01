import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { JwtStrategy } from './jwt.strategy.js';

function strategy(user: unknown) {
  return new JwtStrategy(
    { get: () => 'development-access-secret' } as unknown as ConfigService,
    { user: { findUnique: vi.fn().mockResolvedValue(user) } } as unknown as PrismaService,
  );
}

describe('JwtStrategy', () => {
  it('rejects a refresh payload', async () => {
    await expect(strategy(null).validate({ sub: 'u1', type: 'refresh' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a missing user', async () => {
    await expect(strategy(null).validate({ sub: 'u1', type: 'access' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a suspended user', async () => {
    await expect(
      strategy({ id: 'u1', email: 'a@b.com', role: UserRole.BUYER, status: UserStatus.SUSPENDED }).validate({
        sub: 'u1',
        type: 'access',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the public user for an active access token', async () => {
    await expect(
      strategy({ id: 'u1', email: 'a@b.com', role: UserRole.BUYER, status: UserStatus.ACTIVE }).validate({
        sub: 'u1',
        type: 'access',
      }),
    ).resolves.toEqual({ id: 'u1', email: 'a@b.com', role: UserRole.BUYER });
  });
});
