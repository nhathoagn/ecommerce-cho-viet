import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: process.env.WEB_URL ?? 'http://localhost:5173', credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecommerce Marketplace API')
    .setDescription('API cho người mua, người bán, MoMo và Cloudflare R2')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
