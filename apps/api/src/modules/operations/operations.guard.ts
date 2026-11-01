import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** Constant-time compare: a length mismatch already fails, so timing leaks nothing useful. */
function sameKey(expected: string, actual: string | undefined) {
  if (!actual) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

@Injectable()
export class OperationsGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const expected = this.config.get<string>('OPS_API_KEY');
    const actual = context.switchToHttp().getRequest<Request>().header('x-ops-api-key');
    if (!expected || !sameKey(expected, actual)) throw new UnauthorizedException('Invalid operations key');
    return true;
  }
}
