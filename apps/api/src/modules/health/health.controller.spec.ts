import type { HealthCheckService } from '@nestjs/terminus';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('live does not touch the database', () => {
    const queryRaw = vi.fn();
    const check = vi.fn();
    const controller = new HealthController(
      { check } as unknown as HealthCheckService,
      { $queryRaw: queryRaw } as unknown as PrismaService,
    );
    expect(controller.live()).toEqual({ status: 'ok', service: 'ecommerce-api' });
    expect(queryRaw).not.toHaveBeenCalled();
    expect(check).not.toHaveBeenCalled();
  });

  it('ready reports the database up when SELECT 1 resolves', async () => {
    const queryRaw = vi.fn().mockResolvedValue(1);
    const check = vi.fn(async (indicators: Array<() => Promise<unknown>>) => indicators[0]?.());
    const controller = new HealthController(
      { check } as unknown as HealthCheckService,
      { $queryRaw: queryRaw } as unknown as PrismaService,
    );
    await expect(controller.check()).resolves.toEqual({ database: { status: 'up' } });
    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it('ready rejects when SELECT 1 rejects', async () => {
    const queryRaw = vi.fn().mockRejectedValue(new Error('down'));
    const check = vi.fn(async (indicators: Array<() => Promise<unknown>>) => indicators[0]?.());
    const controller = new HealthController(
      { check } as unknown as HealthCheckService,
      { $queryRaw: queryRaw } as unknown as PrismaService,
    );
    await expect(controller.check()).rejects.toThrow('down');
  });
});
