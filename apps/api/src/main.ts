import { Logger } from 'nestjs-pino';
import { createApp } from './app.factory.js';

async function bootstrap() {
  const app = await createApp();
  const logger = app.get(Logger);

  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
