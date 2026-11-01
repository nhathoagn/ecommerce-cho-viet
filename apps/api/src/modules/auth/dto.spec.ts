import 'reflect-metadata';
import { UserRole } from '@prisma/client';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  AddressDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterWithRoleDto,
  UpdateProfileDto,
} from './auth.dto.js';
import { AddCartItemDto, UpdateCartItemDto } from '../cart/cart.dto.js';
import {
  AdjustInventoryDto,
  CreateProductDto,
  CreateStoreDto,
  PresignUploadDto,
  ProductImageDto,
} from '../seller-catalog/catalog.dto.js';
import { CheckoutDto, CreateCouponDto, UpdateOrderStatusDto } from '../orders/orders.dto.js';
import { CreateWithdrawalDto } from '../seller-finance/seller-finance.dto.js';
import { UpdateWithdrawalDto } from '../operations/operations.dto.js';

async function props(dto: object) {
  return (await validate(dto)).map((error) => error.property);
}

describe('DTO validation', () => {
  it('rejects a bad register email', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'buyer@',
      password: '12345678',
      name: 'An',
    });
    expect(await props(dto)).toContain('email');
  });

  it('accepts a valid register payload', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'An',
    });
    expect(await props(dto)).toEqual([]);
  });

  it('rejects a 7 character password', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '1234567',
      name: 'An',
    });
    expect(await props(dto)).toContain('password');
  });

  it('rejects a 1 character name and a 101 character name', async () => {
    const short = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'A',
    });
    const long = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'A'.repeat(101),
    });
    expect(await props(short)).toContain('name');
    expect(await props(long)).toContain('name');
  });

  it('rejects phone lengths outside 6 to 20 and allows a missing phone', async () => {
    const short = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'An',
      phone: '12345',
    });
    const long = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'An',
      phone: '1'.repeat(21),
    });
    const missing = Object.assign(new RegisterDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'An',
    });
    expect(await props(short)).toContain('phone');
    expect(await props(long)).toContain('phone');
    expect(await props(missing)).not.toContain('phone');
  });

  it('requires a name or fullName on the role register dto', async () => {
    const dto = Object.assign(new RegisterWithRoleDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      role: UserRole.BUYER,
    });
    const fields = await props(dto);
    expect(fields).toContain('name');
    expect(fields).toContain('fullName');
  });

  it('accepts fullName without name', async () => {
    const dto = Object.assign(new RegisterWithRoleDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      fullName: 'Nguyen Van A',
      role: UserRole.SELLER,
    });
    expect(await props(dto)).not.toContain('name');
  });

  it('rejects an unknown role and accepts buyer and seller', async () => {
    const bad = Object.assign(new RegisterWithRoleDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'An',
      role: 'ADMIN',
    });
    const buyer = Object.assign(new RegisterWithRoleDto(), {
      email: 'buyer@example.com',
      password: '12345678',
      name: 'An',
      role: UserRole.BUYER,
    });
    expect(await props(bad)).toContain('role');
    expect(await props(buyer)).not.toContain('role');
  });

  it('rejects a bad login email and a missing password', async () => {
    expect(await props(Object.assign(new LoginDto(), { email: 'buyer@' }))).toContain('email');
    expect(
      await props(Object.assign(new LoginDto(), { email: 'buyer@example.com' })),
    ).toContain('password');
  });

  it('allows a one character login password', async () => {
    expect(
      await props(Object.assign(new LoginDto(), { email: 'buyer@example.com', password: 'a' })),
    ).not.toContain('password');
  });

  it('requires a refresh token', async () => {
    expect(await props(new RefreshTokenDto())).toContain('refreshToken');
  });

  it('rejects a short profile name and a bad avatar url', async () => {
    expect(await props(Object.assign(new UpdateProfileDto(), { name: 'A' }))).toContain('name');
    expect(
      await props(Object.assign(new UpdateProfileDto(), { avatarUrl: 'not-a-url' })),
    ).toContain('avatarUrl');
    expect(
      await props(Object.assign(new UpdateProfileDto(), { avatarUrl: 'https://cdn.example/a.png' })),
    ).not.toContain('avatarUrl');
  });

  it('requires city on an address and a boolean default flag', async () => {
    expect(
      await props(
        Object.assign(new AddressDto(), {
          recipientName: 'An',
          phone: '0901',
          line1: '1',
          district: '1',
        }),
      ),
    ).toContain('city');
    expect(
      await props(
        Object.assign(new AddressDto(), {
          recipientName: 'An',
          phone: '0901',
          line1: '1',
          district: '1',
          city: 'HN',
          isDefault: 'true',
        }),
      ),
    ).toContain('isDefault');
  });

  it('rejects cart quantity 0', async () => {
    expect(await props(Object.assign(new AddCartItemDto(), { productId: 'p1', quantity: 0 }))).toContain(
      'quantity',
    );
    expect(await props(Object.assign(new AddCartItemDto(), { productId: 'p1', quantity: 1 }))).toEqual(
      [],
    );
    expect(await props(Object.assign(new UpdateCartItemDto(), { quantity: 0 }))).toContain('quantity');
  });

  it('enforces store name length', async () => {
    expect(await props(Object.assign(new CreateStoreDto(), { name: 'A' }))).toContain('name');
    expect(await props(Object.assign(new CreateStoreDto(), { name: 'AB' }))).not.toContain('name');
    expect(await props(Object.assign(new CreateStoreDto(), { name: 'A'.repeat(120) }))).not.toContain(
      'name',
    );
    expect(await props(Object.assign(new CreateStoreDto(), { name: 'A'.repeat(121) }))).toContain('name');
  });

  it('enforces product price, stock, and status', async () => {
    const base = { name: 'Ao', sku: 'SKU1' };
    expect(await props(Object.assign(new CreateProductDto(), { ...base, price: -1 }))).toContain('price');
    expect(await props(Object.assign(new CreateProductDto(), { ...base, price: 0 }))).toContain('price');
    expect(await props(Object.assign(new CreateProductDto(), { ...base, price: 999 }))).toContain('price');
    expect(await props(Object.assign(new CreateProductDto(), { ...base, price: 1000 }))).not.toContain('price');
    expect(await props(Object.assign(new CreateProductDto(), { ...base, price: 1, stock: -1 }))).toContain(
      'stock',
    );
    expect(
      await props(Object.assign(new CreateProductDto(), { ...base, price: 1, status: 'ARCHIVED' })),
    ).toContain('status');
  });

  it('allows a negative inventory delta at the DTO boundary', async () => {
    expect(await props(Object.assign(new AdjustInventoryDto(), { quantity: 1.5 }))).toContain('quantity');
    expect(await props(Object.assign(new AdjustInventoryDto(), { quantity: -2 }))).not.toContain(
      'quantity',
    );
    expect(
      await props(Object.assign(new ProductImageDto(), { objectKey: 'a', position: -1 })),
    ).toContain('position');
  });

  it('requires an upload file name and still allows gif at the DTO', async () => {
    expect(await props(Object.assign(new PresignUploadDto(), { contentType: 'image/png' }))).toContain(
      'fileName',
    );
    expect(
      await props(
        Object.assign(new PresignUploadDto(), { fileName: 'a.gif', contentType: 'image/gif' }),
      ),
    ).toEqual([]);
  });

  it('requires a checkout address and an order status enum', async () => {
    expect(await props(Object.assign(new CheckoutDto(), { couponCode: 'SALE' }))).toContain('addressId');
    expect(await props(Object.assign(new UpdateOrderStatusDto(), { status: 'ARCHIVED' }))).toContain(
      'status',
    );
    expect(await props(Object.assign(new UpdateOrderStatusDto(), { status: 'PAID' }))).not.toContain(
      'status',
    );
  });

  it('enforces coupon bounds', async () => {
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 0 }))).toContain(
      'percentOff',
    );
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 1 }))).not.toContain(
      'percentOff',
    );
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 100 }))).not.toContain(
      'percentOff',
    );
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', percentOff: 101 }))).toContain(
      'percentOff',
    );
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', fixedAmountOff: -1 }))).toContain(
      'fixedAmountOff',
    );
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', maxUses: 0 }))).toContain(
      'maxUses',
    );
    expect(await props(Object.assign(new CreateCouponDto(), { code: 'SALE', expiresAt: 'tomorrow' }))).toContain(
      'expiresAt',
    );
  });

  it('enforces withdrawal amount and bank name', async () => {
    const bank = { bankName: 'VCB', accountNumber: '1', accountName: 'An' };
    expect(await props(Object.assign(new CreateWithdrawalDto(), { ...bank, amount: 9999 }))).toContain(
      'amount',
    );
    expect(await props(Object.assign(new CreateWithdrawalDto(), { ...bank, amount: 10000 }))).not.toContain(
      'amount',
    );
    expect(
      await props(Object.assign(new CreateWithdrawalDto(), { ...bank, bankName: '', amount: 10000 })),
    ).toContain('bankName');
    expect(await props(Object.assign(new UpdateWithdrawalDto(), { status: 'FOO' }))).toContain('status');
  });
});
