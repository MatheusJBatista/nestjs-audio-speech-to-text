import { NestFactory } from '@nestjs/core';
import { Speech2textModule } from './speech2text/speech2text.module';
import { logger } from './speech2text/infrastructure/logger';
import * as fs from 'fs/promises';

async function bootstrap() {
  const app = await NestFactory.create(Speech2textModule);
  await app.listen(process.env.PORT ?? 3000);

  logger.info('Creating transcription-result directory on /');

  fs.mkdir('transcription-result')
    .then(() =>
      logger.info('Directory transcription-result created successfully'),
    )
    .catch(() =>
      logger.info('Directory transcription-result already exists, skipping'),
    );
}
bootstrap();
