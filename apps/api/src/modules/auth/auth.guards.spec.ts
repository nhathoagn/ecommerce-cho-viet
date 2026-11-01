import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './auth.guards.js';

describe('RolesGuard', () => {
  it('allows an endpoint without role metadata', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('enforces role metadata', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.SELLER]),
    } as unknown as Reflector;
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.BUYER } }),
      }),
    } as unknown as ExecutionContext;
    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });

  it('allows an empty role list', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([]),
    } as unknown as Reflector;
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('allows a seller when both roles are accepted', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.BUYER, UserRole.SELLER]),
    } as unknown as Reflector;
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.SELLER } }) }),
    } as unknown as ExecutionContext;
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('throws when role metadata exists and the user is missing', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.BUYER]),
    } as unknown as Reflector;
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;
    expect(() => new RolesGuard(reflector).canActivate(context)).toThrow(TypeError);
  });
});
