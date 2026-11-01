import { describe, expect, it } from 'vitest';
import { pinoRedactPaths } from './app.module.js';

describe('pinoRedactPaths', () => {
  it('lists the four redact paths in order', () => {
    expect(pinoRedactPaths).toEqual([
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.secretKey',
    ]);
  });

  it('does not redact a bare secret field', () => {
    expect(pinoRedactPaths).not.toContain('secret');
    expect(pinoRedactPaths).not.toContain('MOMO_SECRET_KEY');
  });

  it('keeps the password path', () => {
    expect(pinoRedactPaths).toContain('*.password');
  });
});
