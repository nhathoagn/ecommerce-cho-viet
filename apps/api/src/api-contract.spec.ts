import { Test } from '@nestjs/testing';
import { PrismaService } from './database/prisma.service.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';

const frontendContracts = [
  ['post', '/api/auth/login'],
  ['post', '/api/auth/register'],
  ['post', '/api/auth/register/buyer'],
  ['post', '/api/auth/register/seller'],
  ['post', '/api/auth/refresh'],
  ['post', '/api/auth/logout'],
  ['get', '/api/users/me'],
  ['patch', '/api/users/me'],
  ['get', '/api/users/me/addresses'],
  ['post', '/api/users/me/addresses'],
  ['patch', '/api/users/me/addresses/{id}'],
  ['delete', '/api/users/me/addresses/{id}'],
  ['patch', '/api/users/me/addresses/{id}/default'],
  ['get', '/api/cart'],
  ['delete', '/api/cart'],
  ['post', '/api/cart/items'],
  ['patch', '/api/cart/items/{id}'],
  ['delete', '/api/cart/items/{id}'],
  ['get', '/api/categories'],
  ['get', '/api/products'],
  ['get', '/api/products/{slug}'],
  ['get', '/api/seller/store'],
  ['post', '/api/seller/store'],
  ['get', '/api/seller/products'],
  ['post', '/api/seller/products'],
  ['patch', '/api/seller/products/{id}'],
  ['post', '/api/seller/products/{id}/inventory'],
  ['post', '/api/seller/categories'],
  ['post', '/api/uploads/presign'],
  ['get', '/api/orders'],
  ['post', '/api/orders'],
  ['post', '/api/orders/{id}/cancel'],
  ['post', '/api/payments/{orderId}'],
  ['get', '/api/payments/{orderId}/status'],
  ['get', '/api/seller/dashboard'],
  ['get', '/api/seller/wallet'],
  ['post', '/api/seller/withdrawals'],
] as const;

describe('frontend API contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // The contract only needs the module graph and its routes. A stub keeps the suite
    // runnable on a machine with no Postgres.
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ onModuleInit: async () => {}, onModuleDestroy: async () => {} })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(frontendContracts)('%s %s exists in the backend OpenAPI contract', (method, path) => {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    expect(document.paths[path]?.[method]).toBeDefined();
  });
});
