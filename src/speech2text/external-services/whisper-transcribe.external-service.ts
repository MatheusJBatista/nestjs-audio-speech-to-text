import { Injectable } from '@nestjs/common';
import { AzureOpenAI, toFile } from 'openai';
import { logger } from '../infrastructure/logger';
import { Speech2TextBase } from './speech2text.interface';

@Injectable()
export class WhisperTranscriberResolver implements Speech2TextBase {
  async execute(audioContent: Buffer<ArrayBufferLike>) {
    logger.info(`Whisper: Start transcription`);
    const endpoint = process.env.AZURE_OPENAI_WHISPER_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_WHISPER_API_KEY;

    const apiVersion = '2025-01-01-preview';
    const deploymentName = 'whisper';

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment: deploymentName,
    });

    const file = await toFile(audioContent, 'audio-file.webm');

    const result = await client.audio.transcriptions.create({
      model: '',
      file: file,
      response_format: 'verbose_json',
    });

    logger.info(`Whisper: Transcription result: ${result.text}`);

    return result.text;
  }
}
