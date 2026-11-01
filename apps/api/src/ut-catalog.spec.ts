import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Logger } from 'nestjs-pino';
import type { HealthCheckService } from '@nestjs/terminus';
import { OrderStatus, PaymentStatus, ProductStatus, UserRole, UserStatus, WithdrawalStatus } from '@prisma/client';
import { validate } from 'class-validator';
import { firstValueFrom, of } from 'rxjs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { compare, hash } from 'bcryptjs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { validateEnv } from './config/env.validation.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { HealthController } from './modules/health/health.controller.js';
import { pinoRedactPaths } from './app.module.js';
import { RolesGuard } from './modules/auth/auth.guards.js';
import { JwtStrategy } from './modules/auth/jwt.strategy.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import type { AuthService as AuthServiceType } from './modules/auth/auth.service.js';
import { AddressDto, LoginDto, RefreshTokenDto, RegisterDto, RegisterWithRoleDto, UpdateProfileDto } from './modules/auth/auth.dto.js';
import { UsersService } from './modules/users/users.service.js';
import { CatalogService, SellerCatalogService } from './modules/seller-catalog/catalog.service.js';
import { AddCartItemDto, UpdateCartItemDto } from './modules/cart/cart.dto.js';
import { CartService } from './modules/cart/cart.service.js';
import { OrdersService } from './modules/orders/orders.service.js';
import { PaymentsService } from './modules/payments/payments.service.js';
import { SellerFinanceService } from './modules/seller-finance/seller-finance.service.js';
import { OperationsGuard } from './modules/operations/operations.guard.js';
import { OperationsService } from './modules/operations/operations.service.js';
import { UploadsService } from './modules/uploads/uploads.service.js';
import { AdjustInventoryDto, CreateProductDto, CreateStoreDto, PresignUploadDto, ProductImageDto } from './modules/seller-catalog/catalog.dto.js';
import { CheckoutDto, CreateCouponDto, UpdateOrderStatusDto } from './modules/orders/orders.dto.js';
import { CreateWithdrawalDto } from './modules/seller-finance/seller-finance.dto.js';
import { UpdateWithdrawalDto } from './modules/operations/operations.dto.js';
import type { PrismaService } from './database/prisma.service.js';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async (password: string, rounds: number) => `hashed:${rounds}:${password}`),
  compare: vi.fn(async (password: string, hashed: string) => hashed === `hashed:12:${password}`),
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.example/put'),
}));
vi.mock('@aws-sdk/client-s3', () => ({ S3Client: vi.fn(), PutObjectCommand: vi.fn() }));

const validEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ecommerce',
  REDIS_URL: 'redis://localhost:6379',
  MOMO_ENDPOINT: 'https://test-payment.momo.vn/v2/gateway/api/create',
  MOMO_REDIRECT_URL: 'http://localhost:5173/payment/result',
  MOMO_IPN_URL: 'https://example.com/api/payments/momo/ipn',
  CLOUDFLARE_R2_BUCKET_PUBLIC: 'ecommerce-public',
  CLOUDFLARE_R2_BUCKET_PRIVATE: 'ecommerce-private',
};
const required = Object.keys(validEnv);
const orderStatuses = ['PENDING_PAYMENT','PAID','CONFIRMED','PACKING','SHIPPING','DELIVERED','COMPLETED','CANCELLED','REFUND_REQUESTED','REFUNDED'] as const;
const sellerNext: Record<string, string[]> = {
  PENDING_PAYMENT: ['CONFIRMED','CANCELLED'], PAID: ['CONFIRMED','CANCELLED'], CONFIRMED: ['PACKING','CANCELLED'],
  PACKING: ['SHIPPING'], SHIPPING: ['DELIVERED'], DELIVERED: ['COMPLETED'], COMPLETED: [], CANCELLED: [],
  REFUND_REQUESTED: ['REFUNDED'], REFUNDED: [],
};
const cancellable = new Set(['PENDING_PAYMENT','PAID','CONFIRMED']);
const wd = ['PENDING','APPROVED','REJECTED','PAID'] as const;
const wdOk = new Set(['PENDING->APPROVED','PENDING->REJECTED','APPROVED->PAID']);
const user = { id: 'u1', email: 'buyer@example.com', name: 'An', phone: null, avatarUrl: null, role: UserRole.BUYER, status: UserStatus.ACTIVE, passwordHash: 'hashed:12:secret' };

function authService(prisma: unknown) {
  const jwt = { signAsync: vi.fn(async (payload: { type: string }) => payload.type), verifyAsync: vi.fn() };
  const config = { get: (key: string) => key === 'JWT_REFRESH_TTL_SECONDS' ? 2592000 : key === 'JWT_ACCESS_TTL_SECONDS' ? 900 : undefined };
  return { auth: new AuthService(prisma as PrismaService, jwt as unknown as JwtService, config as unknown as ConfigService), jwt };
}
function orders(prisma: unknown) { return new OrdersService(prisma as PrismaService); }
function seller(prisma: unknown) { return new SellerCatalogService(prisma as PrismaService); }
function payments(prisma: unknown) {
  return new PaymentsService(prisma as PrismaService, { get: (key: string) => key === 'MOMO_SECRET_KEY' ? 'test-secret' : 'value' } as unknown as ConfigService);
}
function sign(raw: string) { return createHmac('sha256', 'test-secret').update(raw).digest('hex'); }
function signedIpn(overrides: Record<string, unknown> = {}) {
  const payload = { partnerCode: 'value', orderId: 'o1', requestId: 'r', amount: 10, orderInfo: 'x', orderType: 'x', transId: 1, resultCode: 0, message: 'ok', payType: 'qr', responseTime: 1, extraData: '', signature: '', ...overrides };
  const raw = `accessKey=value&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&payType=${payload.payType}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`;
  payload.signature = sign(raw);
  return payload;
}
async function props(dto: object) { return (await validate(dto)).map((error) => error.property); }
async function intercept(url: string, value: unknown) {
  return firstValueFrom(new ResponseInterceptor().intercept({ switchToHttp: () => ({ getRequest: () => ({ url }) }) } as never, { handle: () => of(value) }));
}
function filterHost() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { json, status, host: { switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ method: 'GET', url: '/api/health/live' }) }) } };
}
function checkoutPrisma(subtotal: number, coupon: unknown, items?: unknown[]) {
  const orderCreate = vi.fn().mockResolvedValue({ id: 'o1' });
  const tx = { product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) }, inventoryTransaction: { create: vi.fn() }, order: { create: orderCreate }, cartItem: { deleteMany: vi.fn() }, coupon: { update: vi.fn() } };
  return { orderCreate, tx, service: orders({
    address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1', recipientName: 'An', phone: '1', line1: '1', line2: null, ward: null, district: '1', city: 'HN', postalCode: null }) },
    cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: items ?? [{ productId: 'p1', quantity: 1, product: { price: subtotal, stock: 9, storeId: 'store-1', name: 'Ao' } }] }) },
    coupon: { findUnique: vi.fn().mockResolvedValue(coupon) },
    $transaction: (fn: (value: typeof tx) => unknown) => fn(tx),
  }) };
}
const couponOk = { id: 'c', code: 'SALE', storeId: 'store-1', active: true, expiresAt: null, maxUses: null, usedCount: 0, minOrderAmount: 0, percentOff: 10, fixedAmountOff: null };

const cases = [...readFileSync(new URL('../../../docs/unit-test-cases.md', import.meta.url), 'utf8').matchAll(/^### (UT-(\d+)) (.+)$/gm)].map((match) => ({ id: match[1], n: Number(match[2]), title: match[3] }));

describe('UT catalog', () => {
  beforeAll(() => { expect(cases).toHaveLength(500); });
  for (const item of cases) {
    it(`${item.id} ${item.title}`, async () => { await run(item.n); });
  }
});

async function run(n: number) {
  if (n === 1) {
    try { validateEnv({}); throw new Error('missing'); } catch (error) {
      const message = error instanceof Error ? error.message : '';
      expect(message.startsWith('Environment validation failed')).toBe(true);
      for (const key of required) expect(message).toContain(key);
    }
    return;
  }
  if (n >= 2 && n <= 15) {
    const key = required[Math.floor((n - 2) / 2)]!;
    const input = { ...validEnv, ...(n % 2 === 1 ? { [key]: '' } : {}) };
    if (n % 2 === 0) delete input[key as keyof typeof input];
    expect(() => validateEnv(input)).toThrow(key);
    return;
  }
  if (n >= 16 && n <= 18) {
    const value = ['development', 'test', 'production'][n - 16]!;
    expect(validateEnv({ ...validEnv, NODE_ENV: value }).NODE_ENV).toBe(value);
    return;
  }
  if (n >= 19 && n <= 21) {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: ['staging', '', '1'][n - 19] })).toThrow('NODE_ENV');
    return;
  }
  if (n === 22) { expect(validateEnv(validEnv).NODE_ENV).toBe('development'); return; }
  if (n >= 23 && n <= 26) {
    const port = [1, 80, 3000, 65535][n - 23]!;
    expect(validateEnv({ ...validEnv, PORT: port }).PORT).toBe(port);
    return;
  }
  if (n >= 27 && n <= 30) {
    expect(() => validateEnv({ ...validEnv, PORT: [-1, 65536, 70000, 'abc'][n - 27] })).toThrow('PORT');
    return;
  }
  if (n === 31) { expect(validateEnv(validEnv).PORT).toBe(3000); return; }
  if (n >= 32 && n <= 37) {
    const level = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'][n - 32]!;
    expect(validateEnv({ ...validEnv, LOG_LEVEL: level }).LOG_LEVEL).toBe(level);
    return;
  }
  if (n >= 38 && n <= 40) {
    expect(() => validateEnv({ ...validEnv, LOG_LEVEL: ['verbose', '', 'INFO'][n - 38] })).toThrow('LOG_LEVEL');
    return;
  }
  if (n === 41) { expect(validateEnv(validEnv).LOG_LEVEL).toBe('info'); return; }
  if (n >= 42 && n <= 47) {
    const key = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'OPS_API_KEY'][Math.floor((n - 42) / 2)]!;
    const length = n % 2 === 0 ? 15 : 16;
    const secret = 'a'.repeat(length);
    if (length === 15) expect(() => validateEnv({ ...validEnv, [key]: secret })).toThrow(key);
    else expect(validateEnv({ ...validEnv, [key]: secret })[key]).toBe(secret);
    return;
  }
  if (n === 48) { expect(validateEnv(validEnv).JWT_ACCESS_SECRET).toBe('development-access-secret'); return; }
  if (n === 49) { expect(validateEnv(validEnv).JWT_REFRESH_SECRET).toBe('development-refresh-secret'); return; }
  if (n === 50) { expect(validateEnv(validEnv).OPS_API_KEY).toBe('local-operations-key-change-me'); return; }
  if (n >= 51 && n <= 54) {
    const [key, value] = [['JWT_ACCESS_TTL_SECONDS', 0], ['JWT_ACCESS_TTL_SECONDS', -1], ['JWT_REFRESH_TTL_SECONDS', 0], ['JWT_REFRESH_TTL_SECONDS', -5]][n - 51]!;
    expect(() => validateEnv({ ...validEnv, [key]: value })).toThrow(String(key));
    return;
  }
  if (n === 55) { expect(validateEnv({ ...validEnv, JWT_ACCESS_TTL_SECONDS: 1 }).JWT_ACCESS_TTL_SECONDS).toBe(1); return; }
  if (n === 56) { expect(validateEnv(validEnv).JWT_ACCESS_TTL_SECONDS).toBe(900); return; }
  if (n === 57) { expect(validateEnv(validEnv).JWT_REFRESH_TTL_SECONDS).toBe(2592000); return; }
  if (n >= 58 && n <= 64) {
    const key = ['REDIS_URL','MOMO_ENDPOINT','MOMO_REDIRECT_URL','MOMO_IPN_URL','WEB_URL','MOMO_QUERY_ENDPOINT','MOMO_REFUND_ENDPOINT'][n - 58]!;
    expect(validateEnv({ ...validEnv, [key]: 'localhost:6379' })[key]).toBe('localhost:6379');
    expect(() => validateEnv({ ...validEnv, [key]: 'not a uri' })).toThrow(key);
    return;
  }
  if (n === 65) { expect(validateEnv(validEnv).WEB_URL).toBe('http://localhost:5173'); return; }
  if (n >= 66 && n <= 72) {
    const key = ['MOMO_PARTNER_CODE','MOMO_ACCESS_KEY','MOMO_SECRET_KEY','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_R2_ACCESS_KEY_ID','CLOUDFLARE_R2_SECRET_ACCESS_KEY','CLOUDFLARE_R2_PUBLIC_URL'][n - 66]!;
    expect(validateEnv({ ...validEnv, [key]: '' })[key]).toBe('');
    return;
  }
  if (n === 73) { expect(validateEnv({ ...validEnv, EXTRA: 'kept' }).EXTRA).toBe('kept'); return; }
  if (n === 74) { expect(() => validateEnv({})).toThrow('Environment validation failed'); return; }
  if (n >= 75 && n <= 84) {
    const value = [{ status: 'ok' }, null, undefined, 0, false, '', [], [1], 12, { a: { b: 1 } }][n - 75];
    const body = await intercept('/api/health/live', value) as { success: boolean; data: unknown; path: string; timestamp: string };
    expect(body.success).toBe(true);
    expect(body.data).toEqual(value);
    expect(body.path).toBe('/api/health/live');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    return;
  }
  if (n >= 85 && n <= 89) {
    const path = ['/api/products', '/api/cart', '/api/orders', '/', ''][n - 85]!;
    const body = await intercept(path, { ok: true }) as { success: boolean; path: string; data: unknown };
    expect(body).toMatchObject({ success: true, path, data: { ok: true } });
    return;
  }
  if (n >= 90 && n <= 97) {
    const statusCode = [400, 401, 403, 404, 409, 422, 429, 500][n - 90]!;
    const logger = { error: vi.fn() };
    const http = filterHost();
    new AllExceptionsFilter(logger as unknown as Logger).catch(new HttpException('nope', statusCode), http.host as never);
    expect(http.status).toHaveBeenCalledWith(statusCode);
    expect(http.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: { statusCode, message: 'nope' }, path: '/api/health/live' }));
    expect(logger.error).toHaveBeenCalledOnce();
    return;
  }
  if (n === 98) {
    const http = filterHost();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(new HttpException({ message: ['a', 'b'] }, 400), http.host as never);
    expect(http.json.mock.calls[0]?.[0].error.message).toEqual(['a', 'b']);
    return;
  }
  if (n === 99) {
    const http = filterHost();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(new HttpException({ message: 'bad field' }, 422), http.host as never);
    expect(http.json.mock.calls[0]?.[0].error.message).toBe('bad field');
    return;
  }
  if (n === 100) {
    const http = filterHost();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(new HttpException({ error: 'x' }, 400), http.host as never);
    expect(typeof http.json.mock.calls[0]?.[0].error.message).toBe('string');
    return;
  }
  if (n === 101) {
    const http = filterHost();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(new Error('db down'), http.host as never);
    expect(http.status).toHaveBeenCalledWith(500);
    expect(http.json.mock.calls[0]?.[0].error.message).toBe('db down');
    return;
  }
  if (n === 102 || n === 103) {
    const http = filterHost();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(n === 102 ? 'boom' : null, http.host as never);
    expect(http.json.mock.calls[0]?.[0].error.message).toBe('Internal server error');
    return;
  }
  if (n === 104) {
    const http = filterHost();
    new AllExceptionsFilter({ error: vi.fn() } as unknown as Logger).catch(new Error('x'), http.host as never);
    expect(http.json).toHaveBeenCalled();
    return;
  }
  if (n === 105) {
    const queryRaw = vi.fn();
    const check = vi.fn();
    expect(new HealthController({ check } as unknown as HealthCheckService, { $queryRaw: queryRaw } as never).live()).toEqual({ status: 'ok', service: 'ecommerce-api' });
    expect(queryRaw).not.toHaveBeenCalled();
    expect(check).not.toHaveBeenCalled();
    return;
  }
  if (n === 106 || n === 108) {
    const queryRaw = vi.fn().mockResolvedValue(1);
    const check = vi.fn(async (indicators: Array<() => Promise<unknown>>) => indicators[0]?.());
    await expect(new HealthController({ check } as unknown as HealthCheckService, { $queryRaw: queryRaw } as never).check()).resolves.toEqual({ database: { status: 'up' } });
    expect(queryRaw).toHaveBeenCalledOnce();
    return;
  }
  if (n === 107) {
    const queryRaw = vi.fn().mockRejectedValue(new Error('down'));
    const check = vi.fn(async (indicators: Array<() => Promise<unknown>>) => indicators[0]?.());
    await expect(new HealthController({ check } as unknown as HealthCheckService, { $queryRaw: queryRaw } as never).check()).rejects.toThrow('down');
    return;
  }
  if (n === 109) {
    expect(pinoRedactPaths).toEqual(['req.headers.authorization', 'req.headers.cookie', '*.password', '*.secretKey']);
    return;
  }
  if (n === 110) { expect(pinoRedactPaths).not.toContain('secret'); expect(pinoRedactPaths).not.toContain('MOMO_SECRET_KEY'); return; }
  if (n === 111) { expect(pinoRedactPaths).toContain('*.password'); return; }
  if (n >= 112 && n <= 117) {
    const roles = [undefined, [], [UserRole.BUYER], [UserRole.SELLER], [UserRole.BUYER, UserRole.SELLER], [UserRole.BUYER]][n - 112];
    const userRole = n === 116 ? UserRole.SELLER : UserRole.BUYER;
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(roles) };
    const context = { getHandler: vi.fn(), getClass: vi.fn(), switchToHttp: () => ({ getRequest: () => (n === 117 ? {} : { user: { role: userRole } }) }) };
    const act = () => new RolesGuard(reflector as never).canActivate(context as never);
    if (n === 117) expect(act).toThrow(TypeError);
    else if (n === 115) expect(act()).toBe(false);
    else expect(act()).toBe(true);
    return;
  }
  if (n >= 118 && n <= 121) {
    const found = n === 119 ? null : n === 120 ? { id: 'u1', email: 'a@b.com', role: UserRole.BUYER, status: UserStatus.SUSPENDED } : { id: 'u1', email: 'a@b.com', role: UserRole.BUYER, status: UserStatus.ACTIVE };
    const strategy = new JwtStrategy({ get: () => 'secret' } as unknown as ConfigService, { user: { findUnique: vi.fn().mockResolvedValue(found) } } as unknown as PrismaService);
    const result = strategy.validate({ sub: 'u1', type: n === 118 ? 'refresh' : 'access' });
    if (n === 121) await expect(result).resolves.toEqual({ id: 'u1', email: 'a@b.com', role: UserRole.BUYER });
    else await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    return;
  }
  if (n === 122 || n === 487) {
    const create = vi.fn(async ({ data }) => ({ ...user, ...data }));
    const { auth } = authService({ user: { findUnique: vi.fn().mockResolvedValue(null), create }, refreshToken: { create: vi.fn() } });
    await auth.register({ email: '  Buyer@Example.com ', password: 'secret', name: '  An ' }, UserRole.BUYER);
    expect(create.mock.calls[0]?.[0].data.email).toBe('buyer@example.com');
    expect(hash).toHaveBeenCalledWith('secret', 12);
    return;
  }
  if (n === 123) {
    const create = vi.fn();
    const { auth } = authService({ user: { findUnique: vi.fn().mockResolvedValue(user), create } });
    await expect(auth.register({ email: 'a@b.com', password: 'secret', name: 'An' }, UserRole.BUYER)).rejects.toThrow('Email is already registered');
    expect(create).not.toHaveBeenCalled();
    return;
  }
  if (n === 124) {
    const create = vi.fn(async ({ data }) => ({ ...user, ...data }));
    const { auth } = authService({ user: { findUnique: vi.fn().mockResolvedValue(null), create }, refreshToken: { create: vi.fn() } });
    await auth.register({ email: 's@example.com', password: 'secret', name: 'An' }, UserRole.SELLER);
    expect(create.mock.calls[0]?.[0].data.role).toBe(UserRole.SELLER);
    return;
  }
  if (n === 125 || n === 129) {
    const findUnique = vi.fn().mockResolvedValue(null);
    const { auth } = authService({ user: { findUnique } });
    await expect(auth.login({ email: n === 129 ? '  A@B.COM ' : 'missing@example.com', password: 'x' })).rejects.toThrow('Invalid email or password');
    if (n === 129) expect(findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    return;
  }
  if (n === 126) {
    vi.mocked(compare).mockResolvedValueOnce(false as never);
    const { auth } = authService({ user: { findUnique: vi.fn().mockResolvedValue(user) } });
    await expect(auth.login({ email: user.email, password: 'nope' })).rejects.toThrow('Invalid email or password');
    return;
  }
  if (n === 127) {
    const create = vi.fn();
    const { auth } = authService({ user: { findUnique: vi.fn().mockResolvedValue({ ...user, status: UserStatus.SUSPENDED }) }, refreshToken: { create } });
    await expect(auth.login({ email: user.email, password: 'secret' })).rejects.toThrow('Account is suspended');
    expect(create).not.toHaveBeenCalled();
    return;
  }
  if (n === 128 || n === 139 || n === 489) {
    const refreshCreate = vi.fn();
    const { auth, jwt } = authService({ user: { findUnique: vi.fn().mockResolvedValue(user) }, refreshToken: { create: refreshCreate } });
    const session = await auth.login({ email: user.email, password: 'secret' });
    expect(session.user).not.toHaveProperty('passwordHash');
    if (n === 128) expect(refreshCreate.mock.calls[0]?.[0].data.tokenHash).toBe(createHash('sha256').update('refresh').digest('hex'));
    if (n === 489) {
      expect(jwt.signAsync).toHaveBeenCalledWith(expect.objectContaining({ type: 'access' }), expect.anything());
      expect(jwt.signAsync).toHaveBeenCalledWith(expect.objectContaining({ type: 'refresh', jti: expect.any(String) }), expect.anything());
    }
    return;
  }
  if (n === 488) {
    const refreshCreate = vi.fn();
    const { auth } = authService({ user: { findUnique: vi.fn().mockResolvedValue(user) }, refreshToken: { create: refreshCreate } });
    const before = Date.now();
    await auth.login({ email: user.email, password: 'secret' });
    const expiresAt = refreshCreate.mock.calls[0]?.[0].data.expiresAt as Date;
    expect(expiresAt.getTime()).toBeGreaterThan(before + 2592000 * 1000 - 2000);
    return;
  }
  if (n === 130 || n === 131) {
    const { auth, jwt } = authService({});
    if (n === 130) jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    else jwt.verifyAsync.mockResolvedValue({ type: 'access' });
    await expect(auth.refresh('raw')).rejects.toThrow('Invalid refresh token');
    return;
  }
  if (n >= 132 && n <= 134) {
    const stored = n === 132 ? null : n === 133 ? { revokedAt: new Date(), expiresAt: new Date(Date.now() + 1000), user } : { revokedAt: null, expiresAt: new Date(Date.now() - 1000), user };
    const { auth, jwt } = authService({ refreshToken: { findUnique: vi.fn().mockResolvedValue(stored) } });
    jwt.verifyAsync.mockResolvedValue({ type: 'refresh' });
    await expect(auth.refresh('raw')).rejects.toThrow('Refresh token is expired or revoked');
    return;
  }
  if (n === 135) {
    const update = vi.fn();
    const { auth, jwt } = authService({ refreshToken: { findUnique: vi.fn().mockResolvedValue({ id: 't1', revokedAt: null, expiresAt: new Date(Date.now() + 1000), user: { ...user, status: UserStatus.SUSPENDED } }), update } });
    jwt.verifyAsync.mockResolvedValue({ type: 'refresh' });
    await expect(auth.refresh('raw')).rejects.toThrow('Account is suspended');
    expect(update).not.toHaveBeenCalled();
    return;
  }
  if (n === 136) {
    const update = vi.fn();
    const { auth, jwt } = authService({ refreshToken: { findUnique: vi.fn().mockResolvedValue({ id: 't1', revokedAt: null, expiresAt: new Date(Date.now() + 1000), user }), update, create: vi.fn() } });
    jwt.verifyAsync.mockResolvedValue({ type: 'refresh' });
    await expect(auth.refresh('raw')).resolves.toMatchObject({ accessToken: 'access' });
    expect(update).toHaveBeenCalled();
    return;
  }
  if (n === 137 || n === 138 || n === 496) {
    const updateMany = vi.fn().mockResolvedValue({ count: n === 137 ? 0 : 1 });
    const { auth } = authService({ refreshToken: { updateMany } });
    await expect(auth.logout('abc')).resolves.toEqual({ success: true });
    expect(updateMany.mock.calls[0]?.[0].where.tokenHash).toBe(createHash('sha256').update('abc').digest('hex'));
    return;
  }
  if (n >= 140 && n <= 146) {
    const register = vi.fn().mockResolvedValue({});
    const login = vi.fn();
    const refresh = vi.fn();
    const logout = vi.fn();
    const controller = new AuthController({ register, login, refresh, logout } as unknown as AuthServiceType);
    if (n === 140) {
      await controller.register({ name: 'An', fullName: 'Khac', email: 'a@b.com', password: 'password123', role: UserRole.BUYER, storeName: 'Shop' });
      expect(register.mock.calls[0]?.[0]).not.toHaveProperty('storeName');
      expect(register).toHaveBeenCalledWith(expect.objectContaining({ name: 'An' }), UserRole.BUYER);
    } else if (n === 141) {
      await controller.register({ fullName: 'An', email: 'a@b.com', password: 'password123', role: UserRole.SELLER });
      expect(register).toHaveBeenCalledWith(expect.objectContaining({ name: 'An' }), UserRole.SELLER);
    } else if (n === 142) {
      await controller.registerBuyer({ email: 'a@b.com', password: 'password123', name: 'An' });
      expect(register).toHaveBeenCalledWith(expect.anything(), UserRole.BUYER);
    } else if (n === 143) {
      await controller.registerSeller({ email: 'a@b.com', password: 'password123', name: 'An' });
      expect(register).toHaveBeenCalledWith(expect.anything(), UserRole.SELLER);
    } else if (n === 144) {
      const dto = { email: 'a@b.com', password: 'x' };
      await controller.login(dto);
      expect(login).toHaveBeenCalledWith(dto);
    } else if (n === 145) {
      await controller.refresh({ refreshToken: 'raw' });
      expect(refresh).toHaveBeenCalledWith('raw');
    } else {
      await controller.logout({ refreshToken: 'raw' });
      expect(logout).toHaveBeenCalledWith('raw');
    }
    return;
  }
  if (n === 147) {
    const findUniqueOrThrow = vi.fn();
    await new UsersService({ user: { findUniqueOrThrow } } as unknown as PrismaService).profile('u1');
    expect(findUniqueOrThrow.mock.calls[0]?.[0].select).not.toHaveProperty('passwordHash');
    return;
  }
  if (n === 148) {
    const update = vi.fn();
    await new UsersService({ user: { update } } as unknown as PrismaService).updateProfile('u1', { name: 'An' });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' }, data: { name: 'An' } }));
    return;
  }
  if (n === 149) {
    const findMany = vi.fn();
    await new UsersService({ address: { findMany } } as unknown as PrismaService).addresses('u1');
    expect(findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
    return;
  }
  if (n >= 150 && n <= 152) {
    const updateMany = vi.fn();
    const create = vi.fn();
    const count = n === 150 ? 0 : 2;
    const isDefault = n === 152;
    const tx = { address: { count: vi.fn().mockResolvedValue(count), updateMany, create } };
    await new UsersService({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService).createAddress('u1', { recipientName: 'An', phone: '1', line1: '1', district: '1', city: 'HN', isDefault });
    expect(create.mock.calls[0]?.[0].data.isDefault).toBe(n !== 151);
    if (n === 151) expect(updateMany).not.toHaveBeenCalled();
    else expect(updateMany).toHaveBeenCalled();
    return;
  }
  if (n === 153 || n === 156) {
    const update = vi.fn();
    const del = vi.fn();
    const service = new UsersService({ address: { findFirst: vi.fn().mockResolvedValue(null), update, delete: del }, $transaction: vi.fn() } as unknown as PrismaService);
    await expect(n === 153 ? service.updateAddress('u1', 'a1', { city: 'HN' }) : service.deleteAddress('u1', 'a1')).rejects.toThrow('Address not found');
    expect(n === 153 ? update : del).not.toHaveBeenCalled();
    return;
  }
  if (n === 154 || n === 155) {
    const updateMany = vi.fn();
    const update = vi.fn();
    const tx = { address: { updateMany, update } };
    await new UsersService({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService).updateAddress('u1', 'a1', n === 154 ? { isDefault: true } : { city: 'HN' });
    if (n === 155) expect(updateMany).not.toHaveBeenCalled();
    else expect(updateMany).toHaveBeenCalled();
    return;
  }
  if (n >= 157 && n <= 159) {
    const update = vi.fn();
    const findFirst = vi.fn();
    if (n === 157) findFirst.mockResolvedValue({ id: 'a1', isDefault: false });
    if (n === 158) findFirst.mockResolvedValueOnce({ id: 'a1', isDefault: true }).mockResolvedValueOnce({ id: 'b2' });
    if (n === 159) findFirst.mockResolvedValueOnce({ id: 'a1', isDefault: true }).mockResolvedValueOnce(null);
    await expect(new UsersService({ address: { findFirst, delete: vi.fn(), update } } as unknown as PrismaService).deleteAddress('u1', 'a1')).resolves.toEqual({ success: true });
    if (n === 158) expect(update).toHaveBeenCalledWith({ where: { id: 'b2' }, data: { isDefault: true } });
    else expect(update).not.toHaveBeenCalled();
    return;
  }
  if (n >= 160 && n <= 167) {
    const names = ['Áo Dài Việt', '  Cà phê  ', 'Hello World', 'SKU-01', '!!!', 'Điện tử'];
    const slugs = ['ao-dai-viet', 'ca-phe', 'hello-world', 'sku-01', 'item', 'dien-tu'];
    const create = vi.fn();
    const taken = n === 166 ? new Set(['ao-dai']) : n === 167 ? new Set(['ao-dai', 'ao-dai-1']) : new Set<string>();
    const name = n >= 166 ? 'Áo Dài' : names[n - 160]!;
    await seller({ store: { findUnique: vi.fn(async ({ where }: { where: { sellerId?: string; slug?: string } }) => where.sellerId ? null : taken.has(where.slug ?? '') ? { id: 'old' } : null), create } }).createStore('s1', { name });
    expect(create.mock.calls[0]?.[0].data.slug).toBe(n === 166 ? 'ao-dai-1' : n === 167 ? 'ao-dai-2' : slugs[n - 160]);
    return;
  }
  if (n === 168 || n === 493) {
    const create = vi.fn();
    if (n === 168) {
      await expect(seller({ store: { findUnique: vi.fn().mockResolvedValue({ id: 's' }) } }).createStore('s1', { name: 'Shop' })).rejects.toThrow('Seller already has a store');
      expect(create).not.toHaveBeenCalled();
    } else {
      await seller({ store: { findUnique: vi.fn().mockResolvedValue(null), create } }).createStore('s1', { name: 'Shop', description: 'Mo ta', logoKey: 'logo' });
      expect(create.mock.calls[0]?.[0].data).toEqual(expect.objectContaining({ description: 'Mo ta', logoKey: 'logo' }));
    }
    return;
  }
  if (n === 169) {
    const create = vi.fn();
    await seller({ store: { findUnique: vi.fn().mockResolvedValue(null), create } }).createStore('u1', { name: 'Áo Dài' });
    expect(create.mock.calls[0]?.[0].data.slug).toBe('ao-dai');
    return;
  }
  if (n === 170 || n === 171) {
    const service = seller({ store: { findUnique: vi.fn().mockResolvedValue(null) } });
    if (n === 170) await expect(service.getStore('s1')).resolves.toBeNull();
    else await expect(service.updateStore('s1', { name: 'X' })).rejects.toThrow('Store not found');
    return;
  }
  if (n === 172) {
    await expect(seller({ category: { findUnique: vi.fn().mockResolvedValue(null) } }).createCategory({ name: 'Ao', parentId: 'p1' })).rejects.toThrow('Parent category not found');
    return;
  }
  if (n === 173) {
    const create = vi.fn();
    await seller({ category: { findUnique: vi.fn().mockResolvedValue(null), create }, store: { findUnique: vi.fn() } }).createCategory({ name: 'Cà phê' });
    expect(create.mock.calls[0]?.[0].data.slug).toBe('ca-phe');
    return;
  }
  if (n === 174 || n === 175) {
    const findMany = vi.fn();
    if (n === 174) await expect(seller({ store: { findUnique: vi.fn().mockResolvedValue(null) } }).listProducts('s1')).rejects.toThrow('Store not found');
    else {
      await seller({ store: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) }, product: { findMany } }).listProducts('s1');
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { storeId: 's1' }, orderBy: { createdAt: 'desc' } }));
    }
    return;
  }
  if (n === 176) {
    await expect(seller({ store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) }, product: { findUnique: vi.fn().mockResolvedValue({ id: 'old' }) } }).createProduct('s1', { name: 'Ao', sku: 'SKU', price: 1 })).rejects.toThrow('SKU already exists');
    return;
  }
  if (n === 177 || n === 178 || n === 179 || n === 180 || n === 485) {
    const inventory = vi.fn();
    const productCreate = vi.fn().mockResolvedValue({ id: 'p1' });
    const tx = { product: { create: productCreate }, inventoryTransaction: { create: inventory } };
    const dto = n === 177 || n === 485 ? { name: 'Ao', sku: 'SKU', price: 1 } : n === 178 ? { name: 'Ao', sku: 'SKU', price: 1, stock: 5 } : n === 179 ? { name: 'Ao', sku: 'SKU', price: 1, stock: 0, status: ProductStatus.ACTIVE } : { name: 'Ao', sku: 'SKU', price: 1, stock: 3, status: ProductStatus.OUT_OF_STOCK };
    await seller({ store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) }, product: { findUnique: vi.fn().mockResolvedValue(null) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).createProduct('s1', dto);
    const data = productCreate.mock.calls[0]?.[0].data;
    if (n === 177) { expect(data.stock).toBe(0); expect(inventory).not.toHaveBeenCalled(); }
    if (n === 178) expect(inventory).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'INITIAL', quantity: 5, after: 5 }) }));
    if (n === 179) expect(data.status).toBe(ProductStatus.OUT_OF_STOCK);
    if (n === 180) expect(data.status).toBe(ProductStatus.ACTIVE);
    if (n === 485) expect(data.compareAtPrice).toBeUndefined();
    return;
  }
  if (n === 181 || n === 182 || n === 183 || n === 486) {
    const update = vi.fn();
    if (n === 183) {
      await expect(seller({ product: { findFirst: vi.fn().mockResolvedValue(null) } }).updateProduct('s1', 'p1', {})).rejects.toBeInstanceOf(NotFoundException);
      return;
    }
    if (n === 181) {
      await expect(seller({ product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 1 }) } }).updateProduct('s1', 'p1', { stock: 4 })).rejects.toThrow('Use the inventory adjustment endpoint to change stock');
      return;
    }
    await seller({ product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock: 1 }), update } }).updateProduct('s1', 'p1', n === 486 ? { images: [{ objectKey: 'a' }] } : { stock: 1, price: 1000 });
    if (n === 486) expect(update.mock.calls[0]?.[0].data.images).toEqual({ deleteMany: {}, create: [{ objectKey: 'a' }] });
    else expect(update).toHaveBeenCalled();
    return;
  }
  if (n >= 184 && n <= 188) {
    const update = vi.fn().mockResolvedValue({});
    const stock = n === 185 ? 2 : n === 186 ? 2 : n === 187 ? 0 : n === 188 ? 1 : 2;
    const status = n === 187 ? ProductStatus.OUT_OF_STOCK : n === 188 ? ProductStatus.DRAFT : ProductStatus.ACTIVE;
    const quantity = n === 185 ? -3 : n === 186 ? -2 : n === 187 ? 4 : 2;
    const tx = { product: { findFirst: vi.fn().mockResolvedValue(n === 184 ? null : { id: 'p1', stock, status }), update }, inventoryTransaction: { create: vi.fn() } };
    const result = seller({ $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).adjustInventory('s1', 'p1', { quantity });
    if (n === 184) await expect(result).rejects.toThrow('Product not found');
    else if (n === 185) await expect(result).rejects.toThrow('Insufficient stock');
    else {
      await result;
      const expectedStatus = n === 186 ? ProductStatus.OUT_OF_STOCK : n === 187 ? ProductStatus.ACTIVE : ProductStatus.DRAFT;
      const expectedStock = stock + quantity;
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { stock: expectedStock, status: expectedStatus } }));
    }
    return;
  }
  if (n === 189 || n === 190) {
    const findMany = vi.fn();
    const del = vi.fn();
    if (n === 190) {
      await expect(seller({ product: { findFirst: vi.fn().mockResolvedValue(null) } }).inventoryHistory('s1', 'p1')).rejects.toThrow('Product not found');
      expect(findMany).not.toHaveBeenCalled();
    } else {
      await expect(seller({ product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1' }), delete: del } }).removeProduct('s1', 'p1')).resolves.toEqual({ deleted: true });
    }
    return;
  }
  if (n >= 191 && n <= 196 || n === 484 || n === 494) {
    const categories = vi.fn();
    const products = vi.fn().mockResolvedValue([{ id: 'p' }]);
    const findFirst = vi.fn().mockResolvedValue(n === 196 ? { id: 'p' } : null);
    const service = new CatalogService({ category: { findMany: categories }, product: { findMany: products, findFirst } } as unknown as PrismaService);
    if (n === 191) {
      await service.categories();
      expect(categories).toHaveBeenCalledWith(expect.objectContaining({ where: { parentId: null }, orderBy: { name: 'asc' } }));
    } else if (n === 195) await expect(service.product('missing')).rejects.toThrow('Product not found');
    else if (n === 196) await expect(service.product('ao')).resolves.toEqual({ id: 'p' });
    else {
      const query = n === 193 ? { search: 'ao' } : n === 194 ? { category: 'ao-dai', store: 'shop-a' } : n === 484 ? { search: '' } : {};
      await service.products(query);
      const where = products.mock.calls[0]?.[0].where;
      expect(where.status).toBe(ProductStatus.ACTIVE);
      if (n === 192 || n === 484) expect(where.name).toBeUndefined();
      if (n === 193) expect(where.name).toEqual({ contains: 'ao', mode: 'insensitive' });
      if (n === 494) expect(products.mock.calls[0]?.[0].orderBy).toEqual({ createdAt: 'desc' });
    }
    return;
  }
  if (n >= 197 && n <= 211 || n === 490 || n === 495) {
    if (n === 197 || n === 495) {
      const upsert = vi.fn();
      await new CartService({ cart: { upsert } } as unknown as PrismaService).get('u1');
      const arg = upsert.mock.calls[0]?.[0];
      expect(arg.where).toEqual({ userId: 'u1' });
      if (n === 495) expect(arg.include.items.include.product.include.images.take).toBe(1);
      return;
    }
    if (n === 198 || n === 199 || n === 490) {
      const findFirst = vi.fn().mockResolvedValue(null);
      await expect(new CartService({ product: { findFirst } } as unknown as PrismaService).add('u1', { productId: 'p1', quantity: 1 })).rejects.toThrow('Product not available');
      expect(findFirst).toHaveBeenCalledWith({ where: { id: 'p1', status: ProductStatus.ACTIVE } });
      return;
    }
    if (n === 200 || n === 201 || n === 202 || n === 203 || n === 204) {
      const current = n === 201 ? { quantity: 4 } : n === 203 ? { quantity: 2 } : null;
      const quantity = n === 200 ? 3 : n === 201 ? 2 : n === 204 ? 5 : n === 203 ? 3 : 2;
      const stock = n === 200 ? 2 : 5;
      const upsert = vi.fn();
      const result = new CartService({ product: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', stock }) }, cart: { upsert: vi.fn().mockResolvedValue({ id: 'c1' }) }, cartItem: { findUnique: vi.fn().mockResolvedValue(current), upsert } } as unknown as PrismaService).add('u1', { productId: 'p1', quantity });
      if (n === 200 || n === 201) await expect(result).rejects.toThrow('Quantity exceeds available stock');
      else { await result; expect(upsert).toHaveBeenCalled(); }
      return;
    }
    if (n >= 205 && n <= 207) {
      const update = vi.fn();
      const found = n === 205 ? null : { product: { stock: n === 206 ? 2 : 4 } };
      const result = new CartService({ cartItem: { findFirst: vi.fn().mockResolvedValue(found), update }, cart: { upsert: vi.fn() } } as unknown as PrismaService).update('u1', 'i1', { quantity: n === 206 ? 3 : 4 });
      if (n === 205) await expect(result).rejects.toThrow('Cart item not found');
      else if (n === 206) await expect(result).rejects.toThrow('Quantity exceeds available stock');
      else { await result; expect(update).toHaveBeenCalledWith({ where: { id: 'i1' }, data: { quantity: 4 } }); }
      return;
    }
    if (n === 208 || n === 209) {
      const del = vi.fn();
      const result = new CartService({ cartItem: { findFirst: vi.fn().mockResolvedValue(n === 208 ? null : { id: 'i1' }), delete: del }, cart: { upsert: vi.fn() } } as unknown as PrismaService).remove('u1', 'i1');
      if (n === 208) await expect(result).rejects.toThrow('Cart item not found');
      else { await result; expect(del).toHaveBeenCalled(); }
      return;
    }
    const deleteMany = vi.fn();
    await new CartService({ cart: { findUnique: vi.fn().mockResolvedValue(n === 210 ? null : { id: 'c1' }), upsert: vi.fn() }, cartItem: { deleteMany } } as unknown as PrismaService).clear('u1');
    if (n === 210) expect(deleteMany).not.toHaveBeenCalled();
    else expect(deleteMany).toHaveBeenCalledWith({ where: { cartId: 'c1' } });
    return;
  }
  if (n >= 212 && n <= 219 || n === 500) {
    const table: Record<number, [number, unknown, number, number, number, unknown[]?]> = {
      212: [499999, null, 30000, 0, 529999],
      213: [500000, null, 0, 0, 500000],
      214: [500001, null, 0, 0, 500001],
      215: [100000, { ...couponOk, percentOff: 10 }, 30000, 10000, 120000],
      216: [500000, { ...couponOk, percentOff: 10 }, 0, 50000, 450000],
      217: [100000, { ...couponOk, percentOff: null, fixedAmountOff: 20000 }, 30000, 20000, 110000],
      218: [100000, { ...couponOk, percentOff: null, fixedAmountOff: 999999 }, 30000, 100000, 30000],
      219: [80000, { ...couponOk, percentOff: 100 }, 30000, 80000, 30000],
    };
    if (n === 500) {
      const built = checkoutPrisma(0, null, [
        { productId: 'p1', quantity: 2, product: { price: 10000, stock: 5, storeId: 's', name: 'A' } },
        { productId: 'p2', quantity: 1, product: { price: 5000, stock: 5, storeId: 's', name: 'B' } },
      ]);
      await built.service.checkout('u1', { addressId: 'a1' });
      expect(Number(built.orderCreate.mock.calls[0]?.[0].data.subtotal)).toBe(25000);
      expect(Number(built.orderCreate.mock.calls[0]?.[0].data.totalAmount)).toBe(55000);
      return;
    }
    const row = table[n]!;
    const built = checkoutPrisma(row[0], row[1]);
    await built.service.checkout('u1', { addressId: 'a1', couponCode: row[1] ? 'sale' : undefined });
    const data = built.orderCreate.mock.calls[0]?.[0].data;
    expect(Number(data.shippingAmount)).toBe(row[2]);
    expect(Number(data.discountAmount)).toBe(row[3]);
    expect(Number(data.totalAmount)).toBe(row[4]);
    return;
  }
  if (n >= 220 && n <= 227 || n === 492 || n === 497) {
    if (n === 220) { await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue(null) } }).checkout('u1', { addressId: 'a1' })).rejects.toThrow('Shipping address not found'); return; }
    if (n === 221 || n === 222) {
      await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, cart: { findUnique: vi.fn().mockResolvedValue(n === 221 ? null : { items: [] }) } }).checkout('u1', { addressId: 'a1' })).rejects.toThrow('Cart is empty');
      return;
    }
    if (n === 223) {
      await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, cart: { findUnique: vi.fn().mockResolvedValue({ items: [{ product: { storeId: 'a', stock: 5, price: 1, name: 'A' }, quantity: 1 }, { product: { storeId: 'b', stock: 5, price: 1, name: 'B' }, quantity: 1 }] }) } }).checkout('u1', { addressId: 'a1' })).rejects.toThrow('Checkout supports one store at a time');
      return;
    }
    if (n === 224) {
      await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, cart: { findUnique: vi.fn().mockResolvedValue({ items: [{ quantity: 3, product: { stock: 1, price: 10, storeId: 's', name: 'Áo' } }] }) } }).checkout('u1', { addressId: 'a1' })).rejects.toThrow('Insufficient stock for Áo');
      return;
    }
    if (n === 225) {
      const tx = { product: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
      await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: [{ quantity: 1, product: { stock: 5, price: 10, storeId: 's', name: 'Áo' } }] }) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).checkout('u1', { addressId: 'a1' })).rejects.toBeInstanceOf(BadRequestException);
      return;
    }
    const built = checkoutPrisma(1000, null, [{ productId: 'p1', quantity: 2, product: { price: 500, stock: 5, storeId: 's', name: 'Ao' } }]);
    await built.service.checkout('u1', { addressId: 'a1' });
    if (n === 226) expect(built.tx.inventoryTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'SALE', quantity: -2, before: 5, after: 3 }) }));
    if (n === 227) expect(built.orderCreate.mock.calls[0]?.[0].data.code).toMatch(/^CV-/);
    if (n === 492) expect(built.orderCreate.mock.calls[0]?.[0].data.shippingAddress).not.toHaveProperty('userId');
    if (n === 497) {
      const inventory = vi.fn();
      await orders({ order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1', status: OrderStatus.PENDING_PAYMENT, items: [{ productId: 'p1', quantity: 2 }] }) }, $transaction: async (fn: (tx: unknown) => unknown) => fn({ product: { update: vi.fn().mockResolvedValue({ stock: 4 }) }, inventoryTransaction: { create: inventory }, order: { update: vi.fn() } }) }).cancel('u1', 'o1');
      expect(inventory).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'RETURN', quantity: 2 }) }));
    }
    return;
  }
  if (n >= 228 && n <= 235) {
    const reasons = ['missing', 'other-store', 'inactive', 'expired', 'used-up', 'minimum'];
    if (n <= 233) {
      const reason = reasons[n - 228]!;
      const coupon = reason === 'missing' ? null : { ...couponOk, storeId: reason === 'other-store' ? 'other' : 'store-1', active: reason !== 'inactive', expiresAt: reason === 'expired' ? new Date(Date.now() - 1000) : null, maxUses: reason === 'used-up' ? 1 : null, usedCount: reason === 'used-up' ? 1 : 0, minOrderAmount: reason === 'minimum' ? 999999 : 0 };
      const findUnique = vi.fn().mockResolvedValue(coupon);
      await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: [{ quantity: 1, product: { price: 1000, stock: 5, storeId: 'store-1', name: 'Ao' } }] }) }, coupon: { findUnique } }).checkout('u1', { addressId: 'a1', couponCode: '  sale ' })).rejects.toThrow('Coupon is not valid');
      if (n === 235) expect(findUnique).toHaveBeenCalledWith({ where: { code: 'SALE' } });
      return;
    }
    if (n === 235) {
      const findUnique = vi.fn().mockResolvedValue(null);
      await expect(orders({ address: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }) }, cart: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', items: [{ quantity: 1, product: { price: 1000, stock: 5, storeId: 'store-1', name: 'Ao' } }] }) }, coupon: { findUnique } }).checkout('u1', { addressId: 'a1', couponCode: '  sale ' })).rejects.toThrow('Coupon is not valid');
      expect(findUnique).toHaveBeenCalledWith({ where: { code: 'SALE' } });
      return;
    }
    const built = checkoutPrisma(1000, couponOk);
    await built.service.checkout('u1', { addressId: 'a1', couponCode: 'sale' });
    expect(built.tx.coupon.update).toHaveBeenCalledWith({ where: { id: 'c' }, data: { usedCount: { increment: 1 } } });
    return;
  }
  if (n >= 236 && n <= 246) {
    const status = n === 246 ? OrderStatus.PENDING_PAYMENT : orderStatuses[n - 236]!;
    if (n === 246) {
      await expect(orders({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).cancel('u1', 'o1')).rejects.toThrow('Order not found');
      return;
    }
    const result = orders({ order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1', status, items: [] }) }, $transaction: async (fn: (tx: unknown) => unknown) => fn({ product: { update: vi.fn().mockResolvedValue({ stock: 1 }) }, inventoryTransaction: { create: vi.fn() }, order: { update: vi.fn().mockResolvedValue({ status: OrderStatus.CANCELLED }) } }) }).cancel('u1', 'o1');
    if (cancellable.has(status)) await expect(result).resolves.toMatchObject({ status: OrderStatus.CANCELLED });
    else await expect(result).rejects.toThrow('Order can no longer be cancelled');
    return;
  }
  if (n >= 247 && n <= 249) {
    const findMany = vi.fn();
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = orders({ order: { findMany, findFirst } });
    if (n === 247) await expect(service.buyerOrder('u1', 'missing')).rejects.toThrow('Order not found');
    if (n === 248) { await service.buyerOrders('u1'); expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { buyerId: 'u1' } })); }
    if (n === 249) { await service.sellerOrders('s1'); expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { store: { sellerId: 's1' } } })); }
    return;
  }
  if (n >= 250 && n <= 349 || n === 350 || n === 498) {
    if (n === 350) { await expect(orders({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).sellerUpdate('s', 'o1', { status: OrderStatus.PAID })).rejects.toThrow('Order not found'); return; }
    const index = n === 498 ? 17 : n - 250;
    const from = orderStatuses[Math.floor(index / 10)]!;
    const to = n === 498 ? 'CANCELLED' : orderStatuses[index % 10]!;
    const allowed = sellerNext[from]!.includes(to);
    const result = orders({ order: { findFirst: vi.fn().mockResolvedValue({ id: 'o1', status: from, items: [] }), update: vi.fn().mockResolvedValue({ status: to }) }, $transaction: async (fn: (tx: unknown) => unknown) => fn({ product: { update: vi.fn().mockResolvedValue({ stock: 1 }) }, inventoryTransaction: { create: vi.fn() }, order: { update: vi.fn().mockResolvedValue({ status: to }) } }) }).sellerUpdate('seller', 'o1', { status: to as OrderStatus });
    if (allowed) await expect(result).resolves.toMatchObject({ status: to });
    else await expect(result).rejects.toThrow(`Invalid transition ${from} → ${to}`);
    return;
  }
  if (n >= 351 && n <= 356) {
    const create = vi.fn();
    if (n === 351) { await expect(orders({ store: { findUnique: vi.fn().mockResolvedValue(null) } }).createCoupon('s1', { code: 'sale' })).rejects.toBeInstanceOf(ForbiddenException); return; }
    if (n === 352 || n === 353) {
      await expect(orders({ store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) }, coupon: { create } }).createCoupon('s1', n === 352 ? { code: 'sale' } : { code: 'sale', percentOff: 10, fixedAmountOff: 1 })).rejects.toThrow('Choose percent or fixed discount');
      return;
    }
    await orders({ store: { findUnique: vi.fn().mockResolvedValue({ id: 'store' }) }, coupon: { create } }).createCoupon('s1', n === 354 ? { code: '  sale ', percentOff: 10 } : n === 355 ? { code: 'sale', fixedAmountOff: 20000 } : { code: 'sale', percentOff: 10 });
    if (n === 354) expect(create.mock.calls[0]?.[0].data.code).toBe('SALE');
    if (n === 356) expect(create.mock.calls[0]?.[0].data.minOrderAmount).toBeDefined();
    return;
  }
  if (n >= 357 && n <= 371 || n === 499) {
    if (n === 357) { await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue(null) } }).create('u1', 'o1')).rejects.toBeInstanceOf(NotFoundException); return; }
    if (n >= 358 && n <= 366) {
      await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue({ status: orderStatuses[n - 357] }) } }).create('u1', 'o1')).rejects.toThrow('Order is not awaiting payment');
      return;
    }
    if (n === 367) {
      await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) }, payment: { findUnique: vi.fn().mockResolvedValue({ status: PaymentStatus.SUCCESS }) } }).create('u1', 'o1')).rejects.toThrow('Order already paid');
      return;
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: n !== 370, json: async () => n === 368 ? { resultCode: 1001, message: 'rejected' } : n === 369 ? { resultCode: 1001 } : { resultCode: 0, payUrl: 'https://pay' } }));
    if (n === 368 || n === 369 || n === 370) {
      await expect(payments({ order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) }, payment: { findUnique: vi.fn().mockResolvedValue(null) } }).create('u1', 'o1')).rejects.toThrow(n === 368 ? 'rejected' : n === 369 ? 'MoMo rejected payment request' : 'MoMo gateway unavailable');
      vi.unstubAllGlobals();
      return;
    }
    const upsert = vi.fn().mockResolvedValue({ id: 'pay', payUrl: 'https://pay' });
    const result = await payments({ order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT, totalAmount: 10, code: 'CV' }) }, payment: { findUnique: vi.fn().mockResolvedValue(n === 371 ? { status: PaymentStatus.PENDING, requestId: 'req-1' } : null), upsert } }).create('u1', 'o1');
    if (n === 371) expect(result.requestId).toBe('req-1');
    if (n === 499) expect(upsert.mock.calls[0]?.[0].create.amount).toBeDefined();
    vi.unstubAllGlobals();
    return;
  }
  if (n >= 372 && n <= 380 || n === 491) {
    if (n === 372) {
      const findFirst = vi.fn();
      await payments({ payment: { findFirst } }).status('u1', 'o1');
      expect(findFirst).toHaveBeenCalledWith({ where: { orderId: 'o1', order: { buyerId: 'u1' } } });
      return;
    }
    if (n === 373) { await expect(payments({ payment: { findFirst: vi.fn().mockResolvedValue(null) } }).query('u1', 'o1')).rejects.toThrow('Payment not found'); return; }
    if (n === 374) { await expect(payments({}).handleIpn({ ...signedIpn(), signature: 'bad' })).rejects.toThrow('Invalid MoMo signature'); return; }
    if (n === 375 || n === 376 || n === 377) {
      const payment = n === 375 ? null : { id: 'pay', requestId: n === 376 ? 'other' : 'r', amount: n === 377 ? 99 : 10, status: PaymentStatus.PENDING };
      await expect(payments({ payment: { findUnique: vi.fn().mockResolvedValue(payment) } }).handleIpn(signedIpn())).rejects.toThrow('Payment does not match order');
      return;
    }
    if (n === 378) {
      const update = vi.fn();
      await expect(payments({ payment: { findUnique: vi.fn().mockResolvedValue({ id: 'pay', requestId: 'r', amount: 10, status: PaymentStatus.SUCCESS }), update } }).handleIpn(signedIpn())).resolves.toEqual({ resultCode: 0, message: 'Received' });
      expect(update).not.toHaveBeenCalled();
      return;
    }
    if (n === 379) {
      const update = vi.fn();
      const payload = signedIpn({ resultCode: 1006 });
      payload.signature = sign(`accessKey=value&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&payType=${payload.payType}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`);
      await payments({ payment: { findUnique: vi.fn().mockResolvedValue({ id: 'pay', requestId: 'r', amount: 10, status: PaymentStatus.PENDING }), update } }).handleIpn(payload);
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PaymentStatus.FAILED, resultCode: 1006 } }));
      return;
    }
    const walletUpsert = vi.fn().mockResolvedValue({ id: 'wallet' });
    const tx = { sellerWallet: { upsert: walletUpsert, update: vi.fn() }, payment: { update: vi.fn() }, order: { update: vi.fn() }, walletTransaction: { create: vi.fn() } };
    await payments({ payment: { findUnique: vi.fn().mockResolvedValue({ id: 'pay', requestId: 'r', amount: 10, status: PaymentStatus.PENDING, orderId: 'o1', order: { code: 'CV', store: { sellerId: 'seller-1' } } }) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).handleIpn(signedIpn());
    expect(walletUpsert).toHaveBeenCalledWith(expect.objectContaining({ where: { sellerId: 'seller-1' } }));
    return;
  }
  if (n >= 381 && n <= 389) {
    if (n <= 383) {
      const payment = n === 381 ? null : n === 382 ? { status: PaymentStatus.PENDING } : { status: PaymentStatus.SUCCESS, providerTransactionId: null };
      await expect(payments({ payment: { findFirst: vi.fn().mockResolvedValue(payment) } }).refund('s1', 'o1')).rejects.toThrow('Successful payment required');
      return;
    }
    const payment = { id: 'pay', status: PaymentStatus.SUCCESS, providerTransactionId: 'tx', amount: 100000, refundedAmount: 40000, order: { code: 'CV', store: { sellerId: 's1' } } };
    if (n <= 386) {
      await expect(payments({ payment: { findFirst: vi.fn().mockResolvedValue(payment) } }).refund('s1', 'o1', n === 384 ? 0 : n === 385 ? -1 : 70000)).rejects.toThrow('Invalid refund amount');
      return;
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ resultCode: n === 389 ? 9 : 0, message: 'no' }) }));
    const tx = { sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: n === 388 ? 1 : 100000 }), update: vi.fn() }, payment: { update: vi.fn() }, order: { update: vi.fn() }, walletTransaction: { create: vi.fn() } };
    const result = payments({ payment: { findFirst: vi.fn().mockResolvedValue(payment) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) }).refund('s1', 'o1', 60000);
    if (n === 389) await expect(result).rejects.toThrow('no');
    else if (n === 388) await expect(result).rejects.toThrow('Insufficient seller balance for refund');
    else await expect(result).resolves.toBeDefined();
    vi.unstubAllGlobals();
    return;
  }
  if (n >= 390 && n <= 393) {
    if (n === 390) { await expect(new SellerFinanceService({ store: { findUnique: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService).summary('s1')).rejects.toThrow('Store not found'); return; }
    const dto = { amount: 10000, bankName: 'VCB', accountNumber: '1', accountName: 'An' };
    if (n === 391) { await expect(new SellerFinanceService({ sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: 1000 }) } } as unknown as PrismaService).withdraw('s1', dto)).rejects.toThrow('Insufficient wallet balance'); return; }
    const create = vi.fn().mockResolvedValue({ id: 'wd' });
    const tx = { sellerWallet: { updateMany: vi.fn().mockResolvedValue({ count: n === 392 ? 0 : 1 }) }, withdrawalRequest: { create }, walletTransaction: { create: vi.fn() } };
    const result = new SellerFinanceService({ sellerWallet: { upsert: vi.fn().mockResolvedValue({ id: 'w', availableBalance: 20000 }) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService).withdraw('s1', dto);
    if (n === 392) await expect(result).rejects.toThrow('Insufficient wallet balance');
    else { await result; expect(create).toHaveBeenCalled(); }
    return;
  }
  if (n >= 394 && n <= 415) {
    if (n === 410) { await expect(new OperationsService({ withdrawalRequest: { findUnique: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService).updateWithdrawal('w', { status: WithdrawalStatus.APPROVED })).rejects.toThrow('Withdrawal not found'); return; }
    if (n >= 411 && n <= 414) {
      const expected = n === 414 ? '' : 'secret';
      const header = n === 411 ? undefined : n === 412 ? 'nope' : n === 414 ? '' : 'secret';
      const act = () => new OperationsGuard({ get: () => expected } as unknown as ConfigService).canActivate({ switchToHttp: () => ({ getRequest: () => ({ header: () => header }) }) } as never);
      if (n === 413) expect(act()).toBe(true);
      else expect(act).toThrow('Invalid operations key');
      return;
    }
    if (n === 415) {
      const count = vi.fn().mockResolvedValue(1);
      const result = await new OperationsService({ user: { count }, store: { count }, order: { count }, payment: { count }, withdrawalRequest: { count } } as unknown as PrismaService).overview();
      expect(result).toEqual({ users: 1, stores: 1, orders: 1, successfulPayments: 1, pendingWithdrawals: 1 });
      return;
    }
    const index = n - 394;
    const from = wd[Math.floor(index / 4)]!;
    const to = wd[index % 4]!;
    const tx = { withdrawalRequest: { update: vi.fn().mockResolvedValue({ status: to }) }, sellerWallet: { update: vi.fn() }, walletTransaction: { create: vi.fn() }, auditLog: { create: vi.fn() } };
    const result = new OperationsService({ withdrawalRequest: { findUnique: vi.fn().mockResolvedValue({ id: 'w1', status: from, walletId: 'wallet', amount: 10 }) }, $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService).updateWithdrawal('w1', { status: to as WithdrawalStatus });
    if (wdOk.has(`${from}->${to}`)) await expect(result).resolves.toMatchObject({ status: to });
    else await expect(result).rejects.toThrow('Invalid withdrawal transition');
    return;
  }
  if (n >= 416 && n <= 427) {
    const service = new UploadsService({ get: (key: string) => key === 'CLOUDFLARE_R2_PUBLIC_URL' ? (n === 425 ? '' : n === 426 ? 'https://cdn.example/' : 'https://cdn.example') : 'x' } as unknown as ConfigService);
    if (n >= 419 && n <= 422) {
      await expect(service.presign('s1', { fileName: 'a.bin', contentType: ['image/gif', 'application/pdf', 'text/plain', ''][n - 419]! })).rejects.toBeInstanceOf(BadRequestException);
      return;
    }
    const result = await service.presign('s1', { fileName: n === 427 ? 'a.JP$G' : 'a.JPG', contentType: n === 417 ? 'image/png' : n === 418 ? 'image/webp' : 'image/jpeg', folder: n === 423 ? '../Products_A!' : n === 424 ? undefined : 'products' });
    expect(result.expiresIn).toBe(300);
    if (n === 423) expect(result.objectKey.startsWith('ProductsA/s1/')).toBe(true);
    if (n === 424) expect(result.objectKey.startsWith('products/')).toBe(true);
    if (n === 425) expect(result.publicUrl).toBeUndefined();
    if (n === 426) expect(result.publicUrl?.includes('example//')).toBe(false);
    if (n <= 418) expect(getSignedUrl).toHaveBeenCalled();
    return;
  }
  if (n >= 428 && n <= 483) {
    const base = { email: 'buyer@example.com', password: '12345678', name: 'An' };
    const checks: Record<number, () => Promise<void>> = {
      428: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, email: 'buyer@' }))).toContain('email'); },
      429: async () => { expect(await props(Object.assign(new RegisterDto(), base))).toEqual([]); },
      430: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, password: '1234567' }))).toContain('password'); },
      431: async () => { expect(await props(Object.assign(new RegisterDto(), base))).not.toContain('password'); },
      432: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, name: 'A' }))).toContain('name'); },
      433: async () => { expect(await props(Object.assign(new RegisterDto(), base))).not.toContain('name'); },
      434: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, name: 'A'.repeat(101) }))).toContain('name'); },
      435: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, phone: '12345' }))).toContain('phone'); },
      436: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, phone: '123456' }))).not.toContain('phone'); },
      437: async () => { expect(await props(Object.assign(new RegisterDto(), { ...base, phone: '1'.repeat(21) }))).toContain('phone'); },
      438: async () => { expect(await props(Object.assign(new RegisterDto(), base))).not.toContain('phone'); },
      439: async () => { expect(await props(Object.assign(new AddCartItemDto(), { productId: 'p1', quantity: 0 }))).toContain('quantity'); },
      440: async () => { expect(await props(Object.assign(new AddCartItemDto(), { productId: 'p1', quantity: 1 }))).toEqual([]); },
      441: async () => { expect(await props(Object.assign(new UpdateCartItemDto(), { quantity: 0 }))).toContain('quantity'); },
      442: async () => { expect(await props(Object.assign(new CreateStoreDto(), { name: 'A' }))).toContain('name'); },
      443: async () => { expect(await props(Object.assign(new CreateStoreDto(), { name: 'AB' }))).not.toContain('name'); },
      444: async () => { expect(await props(Object.assign(new CreateStoreDto(), { name: 'A'.repeat(120) }))).not.toContain('name'); },
      445: async () => { expect(await props(Object.assign(new CreateStoreDto(), { name: 'A'.repeat(121) }))).toContain('name'); },
      446: async () => { expect(await props(Object.assign(new CreateProductDto(), { name: 'Ao', sku: 'SKU1', price: -1 }))).toContain('price'); },
      447: async () => { expect(await props(Object.assign(new CreateProductDto(), { name: 'Ao', sku: 'SKU1', price: 0 }))).toContain('price'); },
      448: async () => { expect(await props(Object.assign(new CreateProductDto(), { name: 'Ao', sku: 'SKU1', price: 1, stock: -1 }))).toContain('stock'); },
      449: async () => { expect(await props(Object.assign(new CreateProductDto(), { name: 'Ao', sku: 'SKU1', price: 1, status: 'ARCHIVED' }))).toContain('status'); },
      450: async () => { expect(await props(Object.assign(new CreateProductDto(), { name: 'Ao', sku: 'SKU1', price: 1, status: ProductStatus.DRAFT }))).not.toContain('status'); },
      451: async () => { expect(await props(Object.assign(new AdjustInventoryDto(), { quantity: 1.5 }))).toContain('quantity'); },
      452: async () => { expect(await props(Object.assign(new AdjustInventoryDto(), { quantity: -2 }))).not.toContain('quantity'); },
      453: async () => { expect(await props(Object.assign(new ProductImageDto(), { objectKey: 'a', position: -1 }))).toContain('position'); },
      454: async () => { expect(await props(Object.assign(new PresignUploadDto(), { contentType: 'image/png' }))).toContain('fileName'); },
      455: async () => { expect(await props(Object.assign(new PresignUploadDto(), { fileName: 'a.gif', contentType: 'image/gif' }))).toEqual([]); },
      456: async () => { const fields = await props(Object.assign(new RegisterWithRoleDto(), { email: 'buyer@example.com', password: '12345678', role: UserRole.BUYER })); expect(fields).toContain('name'); },
      457: async () => { expect(await props(Object.assign(new RegisterWithRoleDto(), { email: 'buyer@example.com', password: '12345678', fullName: 'Nguyen Van A', role: UserRole.SELLER }))).not.toContain('name'); },
      458: async () => { expect(await props(Object.assign(new RegisterWithRoleDto(), { ...base, role: 'ADMIN' }))).toContain('role'); },
      459: async () => { expect(await props(Object.assign(new RegisterWithRoleDto(), { ...base, role: UserRole.BUYER }))).not.toContain('role'); },
      460: async () => { expect(await props(Object.assign(new RegisterWithRoleDto(), { ...base, role: UserRole.SELLER }))).not.toContain('role'); },
      461: async () => { expect(await props(Object.assign(new LoginDto(), { email: 'buyer@' }))).toContain('email'); },
      462: async () => { expect(await props(Object.assign(new LoginDto(), { email: 'buyer@example.com' }))).toContain('password'); },
      463: async () => { expect(await props(Object.assign(new LoginDto(), { email: 'buyer@example.com', password: 'a' }))).not.toContain('password'); },
      464: async () => { expect(await props(new RefreshTokenDto())).toContain('refreshToken'); },
      465: async () => { expect(await props(Object.assign(new UpdateProfileDto(), { name: 'A' }))).toContain('name'); },
      466: async () => { expect(await props(Object.assign(new UpdateProfileDto(), { avatarUrl: 'not-a-url' }))).toContain('avatarUrl'); },
      467: async () => { expect(await props(Object.assign(new UpdateProfileDto(), { avatarUrl: 'https://cdn.example/a.png' }))).not.toContain('avatarUrl'); },
      468: async () => { expect(await props(Object.assign(new AddressDto(), { recipientName: 'An', phone: '1', line1: '1', district: '1' }))).toContain('city'); },
      469: async () => { expect(await props(Object.assign(new AddressDto(), { recipientName: 'An', phone: '1', line1: '1', district: '1', city: 'HN', isDefault: 'true' }))).toContain('isDefault'); },
      470: async () => { expect(await props(Object.assign(new CheckoutDto(), { couponCode: 'SALE' }))).toContain('addressId'); },
      471: async () => { expect(await props(Object.assign(new UpdateOrderStatusDto(), { status: 'ARCHIVED' }))).toContain('status'); },
      472: async () => { expect(await props(Object.assign(new UpdateOrderStatusDto(), { status: 'PAID' }))).not.toContain('status'); },
      473: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 0 }))).toContain('percentOff'); },
      474: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 1 }))).not.toContain('percentOff'); },
      475: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 100 }))).not.toContain('percentOff'); },
      476: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 101 }))).toContain('percentOff'); },
      477: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', fixedAmountOff: -1 }))).toContain('fixedAmountOff'); },
      478: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', maxUses: 0 }))).toContain('maxUses'); },
      479: async () => { expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', expiresAt: 'tomorrow' }))).toContain('expiresAt'); },
      480: async () => { expect(await props(Object.assign(new CreateWithdrawalDto(), { amount: 9999, bankName: 'VCB', accountNumber: '1', accountName: 'An' }))).toContain('amount'); },
      481: async () => { expect(await props(Object.assign(new CreateWithdrawalDto(), { amount: 10000, bankName: 'VCB', accountNumber: '1', accountName: 'An' }))).not.toContain('amount'); },
      482: async () => { expect(await props(Object.assign(new CreateWithdrawalDto(), { amount: 10000, bankName: '', accountNumber: '1', accountName: 'An' }))).toContain('bankName'); },
      483: async () => { expect(await props(Object.assign(new UpdateWithdrawalDto(), { status: 'FOO' }))).toContain('status'); },
    };
    await checks[n]!();
    return;
  }
  throw new Error(`missing runner for UT-${String(n).padStart(3, '0')}`);
}
