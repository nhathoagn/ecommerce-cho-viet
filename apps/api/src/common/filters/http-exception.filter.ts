import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message = this.resolveMessage(exceptionResponse, exception);

    this.logger.error(
      {
        err: exception,
        method: request.method,
        path: request.url,
        statusCode: status,
      },
      message,
    );

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveMessage(
    response: string | object | null,
    exception: unknown,
  ): string | string[] {
    if (typeof response === 'string') return response;
    if (response && 'message' in response) {
      const message = (response as { message: unknown }).message;
      if (typeof message === 'string' || Array.isArray(message))
        return message as string | string[];
    }
    return exception instanceof Error
      ? exception.message
      : 'Internal server error';
  }
}
