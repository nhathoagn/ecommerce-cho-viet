import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

/**
 * Builds the configured Nest app without binding a port, so the same setup serves
 * both the standalone server (main.ts) and the Vercel function (serverless.ts).
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.setGlobalPrefix('api');
  const webUrl = app.get(ConfigService).get<string>('WEB_URL') ?? 'http://localhost:5173';
  app.enableCors({ origin: webUrl, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  // The schema is a development aid; a public deployment should not advertise its whole surface.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ecommerce Marketplace API')
      .setDescription('API cho người mua, người bán và Cloudflare R2')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, () =>
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  return app;
}
