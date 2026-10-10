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
});
