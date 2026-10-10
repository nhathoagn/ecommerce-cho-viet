import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class OperationsGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const expected = this.config.get<string>('OPS_API_KEY');
    const actual = context.switchToHttp().getRequest<Request>().header('x-ops-api-key');
    if (!expected || actual !== expected) throw new UnauthorizedException('Invalid operations key');
    return true;
  }
}
