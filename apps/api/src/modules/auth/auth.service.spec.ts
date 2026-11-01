import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { AuthService } from './auth.service.js';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async (password: string, rounds: number) => `hashed:${rounds}:${password}`),
  compare: vi.fn(async (password: string, hashed: string) => hashed === `hashed:12:${password}`),
}));

const user = {
  id: 'u1',
  email: 'buyer@example.com',
  name: 'An',
  phone: null,
  avatarUrl: null,
  role: UserRole.BUYER,
  status: UserStatus.ACTIVE,
  passwordHash: 'hashed:12:secret',
};

function service(prisma: unknown) {
  const jwt = {
    signAsync: vi.fn(async (payload: { type: string }) => payload.type),
    verifyAsync: vi.fn(),
  };
  const config = {
    get: (key: string) =>
      key === 'JWT_ACCESS_TTL_SECONDS'
        ? 900
        : key === 'JWT_REFRESH_TTL_SECONDS'
          ? 2_592_000
          : undefined,
  };
  return {
    auth: new AuthService(
      prisma as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    ),
    jwt,
  };
}

describe('AuthService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('trims and lowercases email on register', async () => {
    const create = vi.fn(async ({ data }) => ({ ...user, ...data, id: 'u1' }));
    const { auth } = service({
      user: { findUnique: vi.fn().mockResolvedValue(null), create },
      refreshToken: { create: vi.fn() },
    });
    await auth.register(
      { email: '  Buyer@Example.com ', password: 'secret', name: '  An ' },
      UserRole.BUYER,
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'buyer@example.com',
          name: 'An',
          role: UserRole.BUYER,
          passwordHash: 'hashed:12:secret',
        }),
      }),
    );
    expect(hash).toHaveBeenCalledWith('secret', 12);
  });

  it('rejects a registered email', async () => {
    const create = vi.fn();
    const { auth } = service({
      user: { findUnique: vi.fn().mockResolvedValue(user), create },
    });
    await expect(
      auth.register({ email: 'buyer@example.com', password: 'secret', name: 'An' }, UserRole.BUYER),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });

  it('registers a seller', async () => {
    const create = vi.fn(async ({ data }) => ({ ...user, ...data }));
    const { auth } = service({
      user: { findUnique: vi.fn().mockResolvedValue(null), create },
      refreshToken: { create: vi.fn() },
    });
    await auth.register({ email: 's@example.com', password: 'secret', name: 'An' }, UserRole.SELLER);
    expect(create.mock.calls[0]?.[0].data.role).toBe(UserRole.SELLER);
  });

  it('rejects an unknown login', async () => {
    const { auth } = service({ user: { findUnique: vi.fn().mockResolvedValue(null) } });
    await expect(auth.login({ email: 'missing@example.com', password: 'x' })).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('rejects a bad password', async () => {
    vi.mocked(compare).mockResolvedValueOnce(false as never);
    const { auth } = service({ user: { findUnique: vi.fn().mockResolvedValue(user) } });
    await expect(auth.login({ email: user.email, password: 'nope' })).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('rejects a suspended account', async () => {
    const { auth } = service({
      user: { findUnique: vi.fn().mockResolvedValue({ ...user, status: UserStatus.SUSPENDED }) },
    });
    await expect(auth.login({ email: user.email, password: 'secret' })).rejects.toThrow(
      'Account is suspended',
    );
  });

  it('returns a session without the password hash', async () => {
    const refreshCreate = vi.fn();
    const { auth } = service({
      user: { findUnique: vi.fn().mockResolvedValue(user) },
      refreshToken: { create: refreshCreate },
    });
    const session = await auth.login({ email: '  A@B.COM ', password: 'secret' });
    expect(session.accessToken).toBe('access');
    expect(session.refreshToken).toBe('refresh');
    expect(session.user).not.toHaveProperty('passwordHash');
    expect(refreshCreate.mock.calls[0]?.[0].data.tokenHash).toBe(
      createHash('sha256').update('refresh').digest('hex'),
    );
  });

  it('lowercases the login email', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const { auth } = service({ user: { findUnique } });
    await expect(auth.login({ email: '  A@B.COM ', password: 'x' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });

  it('rejects a refresh token that fails verification', async () => {
    const { auth, jwt } = service({ refreshToken: { findUnique: vi.fn() } });
    jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    await expect(auth.refresh('raw')).rejects.toThrow('Invalid refresh token');
  });

  it('rejects an access token used as refresh', async () => {
    const { auth, jwt } = service({});
    jwt.verifyAsync.mockResolvedValue({ type: 'access' });
    await expect(auth.refresh('raw')).rejects.toThrow('Invalid refresh token');
  });

  it.each([
    null,
    { revokedAt: new Date(), expiresAt: new Date(Date.now() + 1000), user },
    { revokedAt: null, expiresAt: new Date(Date.now() - 1000), user },
  ])('rejects an unusable stored refresh token', async (stored) => {
    const { auth, jwt } = service({
      refreshToken: { findUnique: vi.fn().mockResolvedValue(stored) },
    });
    jwt.verifyAsync.mockResolvedValue({ type: 'refresh' });
    await expect(auth.refresh('raw')).rejects.toThrow('Refresh token is expired or revoked');
  });

  it('rejects refresh for a suspended user', async () => {
    const update = vi.fn();
    const { auth, jwt } = service({
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 't1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 1000),
          user: { ...user, status: UserStatus.SUSPENDED },
        }),
        update,
      },
    });
    jwt.verifyAsync.mockResolvedValue({ type: 'refresh' });
    await expect(auth.refresh('raw')).rejects.toThrow('Account is suspended');
    expect(update).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token', async () => {
    const update = vi.fn();
    const { auth, jwt } = service({
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 't1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 1000),
          user,
        }),
        update,
        create: vi.fn(),
      },
    });
    jwt.verifyAsync.mockResolvedValue({ type: 'refresh' });
    await expect(auth.refresh('raw')).resolves.toMatchObject({ accessToken: 'access' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('logout succeeds for an unknown token', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const { auth } = service({ refreshToken: { updateMany } });
    await expect(auth.logout('abc')).resolves.toEqual({ success: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: createHash('sha256').update('abc').digest('hex'),
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
