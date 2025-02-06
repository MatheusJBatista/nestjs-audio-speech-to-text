import { Injectable } from '@nestjs/common';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { logger } from '../infrastructure/logger';
import * as fs from 'node:fs/promises';
import { Speech2TextBase } from './speech2text.interface';
import { Readable, Writable } from 'node:stream';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class AzureSpeech2TextConversationTranscriberExternalService
  implements Speech2TextBase
{
  async execute(audio: Buffer<ArrayBufferLike>) {
    const transcriber = await this.createTranscriber(audio);
    const jsonResult: string[] = [];

    return new Promise<string[]>((resolve, reject) => {
      let finishIntervalTimer: NodeJS.Timeout;

      transcriber.transcribed = function (s, e) {
        clearInterval(finishIntervalTimer);

        if (e.result.reason === sdk.ResultReason.NoMatch) {
          logger.warning('(transcribed) No speech detected.');
        } else {
          const speakerId = e.result.speakerId || 'Unknown';
          const text = e.result.text;

          logger.info(`(transcribed) Speaker ${speakerId}: ${text}`);

          jsonResult.push(JSON.parse(e.result.json));

          finishIntervalTimer = setInterval(() => onSessionFinished(e), 30000);
        }
      };

      const onSessionFinished = async (e: sdk.SessionEventArgs) => {
        logger.info(`(sessionStopped) SessionId: ${e.sessionId}`);

        await fs.writeFile(
          `transcription-result/microsoft-${e.sessionId}.txt`,
          JSON.stringify(jsonResult),
        );

        transcriber.stopTranscribingAsync();

        resolve(jsonResult);
      };

      transcriber.startTranscribingAsync(
        () => logger.info('Transcription started...'),
        (err) => {
          logger.error(`Transcription error: ${err}`);
          reject(err);
        },
      );
    });
  }

  // TODO: Export this to a module
  private async convertWebMtoWav(inputBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const output: Buffer[] = [];
      const writable = new Writable({
        write(chunk, _, callback) {
          output.push(chunk);
          callback();
        },
      });

      const readable = new Readable();
      readable.push(inputBuffer);
      readable.push(null);

      ffmpeg(readable)
        .inputFormat('webm')
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioBitrate('16')
        .audioChannels(1)
        .format('wav')
        .on('end', () => resolve(Buffer.concat(output)))
        .on('error', reject)
        .pipe(writable);
    });
  }

  private async createTranscriber(audio: Buffer<ArrayBufferLike>) {
    const format = sdk.AudioStreamFormat.getWaveFormat(
      16000,
      16,
      1,
      sdk.AudioFormatTag.PCM,
    );
    const audioStream = sdk.AudioInputStream.createPushStream(format);

    const wavFile = await this.convertWebMtoWav(audio);
    await fs.writeFile('transcription-result/wavExample.wav', wavFile);
    audioStream.write(wavFile);

    const audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SUBSCRIPTION_KEY,
      process.env.AZURE_SERVICE_REGION,
    );

    speechConfig.speechRecognitionLanguage = 'pt-BR';

    // Enable speaker diarization
    speechConfig.setProperty(
      sdk.PropertyId.SpeechServiceConnection_SpeakerIdMode,
      'true',
    );

    const transcriber = new sdk.ConversationTranscriber(
      speechConfig,
      audioConfig,
    );

    return transcriber;
  }
}
