import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

describe('AuthController', () => {
  it('maps the legacy register payload to the auth service contract', async () => {
    const register = vi.fn().mockResolvedValue({ accessToken: 'token' });
    const controller = new AuthController({ register } as unknown as AuthService);

    await controller.register({
      fullName: 'Nguyen Van A',
      email: 'buyer@example.com',
      password: 'password123',
      phone: '0901234567',
      role: UserRole.BUYER,
      storeName: 'Ignored for buyer',
    });

    expect(register).toHaveBeenCalledWith(
      {
        name: 'Nguyen Van A',
        email: 'buyer@example.com',
        password: 'password123',
        phone: '0901234567',
      },
      UserRole.BUYER,
    );
  });

  it('keeps name when both name and fullName are present', async () => {
    const register = vi.fn().mockResolvedValue({});
    await new AuthController({ register } as unknown as AuthService).register({
      name: 'An',
      fullName: 'Khac',
      email: 'buyer@example.com',
      password: 'password123',
      role: UserRole.BUYER,
      storeName: 'Shop',
    });
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'An' }),
      UserRole.BUYER,
    );
    expect(register.mock.calls[0]?.[0]).not.toHaveProperty('storeName');
  });

  it('forces buyer and seller routes', async () => {
    const register = vi.fn().mockResolvedValue({});
    const controller = new AuthController({ register } as unknown as AuthService);
    const dto = { email: 'a@b.com', password: 'password123', name: 'An' };
    await controller.registerBuyer(dto);
    await controller.registerSeller(dto);
    expect(register).toHaveBeenNthCalledWith(1, dto, UserRole.BUYER);
    expect(register).toHaveBeenNthCalledWith(2, dto, UserRole.SELLER);
  });
});
