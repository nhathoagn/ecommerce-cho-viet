import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url: string }>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        path: request.url,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
