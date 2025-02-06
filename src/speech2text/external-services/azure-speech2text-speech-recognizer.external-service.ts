import { Injectable } from '@nestjs/common';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { logger } from '../infrastructure/logger';
import * as fs from 'node:fs/promises';
import { Speech2TextBase } from './speech2text.interface';
import { Readable, Writable } from 'node:stream';
import * as ffmpeg from 'fluent-ffmpeg';

// TODO: you can use this class in a background process (lambda, pub/sub, storage trigger...)
@Injectable()
export class AzureSpeech2TextTranscriptionExternalService
  implements Speech2TextBase
{
  async execute(audio: Buffer<ArrayBufferLike>) {
    const recognizer = await this.createRecognizer(audio);

    let transcription = '';

    const recognizeOnceAsync = () =>
      new Promise<string>((resolve, reject) => {
        // This event will trigger when recognition is finished
        recognizer.recognized = function (s, e) {
          // Indicates that recognizable speech was not detected, and that recognition is done.
          if (e.result.reason === sdk.ResultReason.NoMatch) {
            const noMatchDetail = sdk.NoMatchDetails.fromResult(e.result);
            logger.warning(
              `(recognized)  Reason: ${sdk.ResultReason[e.result.reason]}  NoMatchReason: ${sdk.NoMatchReason[noMatchDetail.reason]}`,
            );
          } else {
            logger.info(
              `(recognized)  Reason: ${sdk.ResultReason[e.result.reason]} Text: ${e.result.text}`,
            );

            transcription += e.result.text + '\n';
          }
        };

        recognizer.speechEndDetected = async function (s, e) {
          const str = '(speechEndDetected) SessionId: ' + e.sessionId;
          logger.info(str);

          recognizer.stopContinuousRecognitionAsync();

          await fs.writeFile(
            `transcription-result/microsoft-${e.sessionId}.json`,
            transcription,
          );

          resolve(transcription);
        };

        recognizer.startContinuousRecognitionAsync(
          async () => {},
          (err) => {
            logger.error(`Failed to recognize audio, ${err}`);
            reject(err);
          },
        );
      });

    return await recognizeOnceAsync();
  }

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

  private async createRecognizer(audio: Buffer<ArrayBufferLike>) {
    const format = sdk.AudioStreamFormat.getWaveFormat(
      16000,
      16,
      1,
      sdk.AudioFormatTag.PCM,
    );

    const audioStream = sdk.AudioInputStream.createPushStream(format);

    // In my use case im receiving always a webm file. You dont need to convert if your file is one of these:
    // PCM WAV (16-bit, 8kHz or 16kHz, mono)
    // FLAC
    // OGG (Opus) (for batch transcription only)
    // MP3
    const wavFile = await this.convertWebMtoWav(audio);
    await fs.writeFile('transcription-result/wavExample.wav', wavFile);

    audioStream.write(wavFile);

    const audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SUBSCRIPTION_KEY,
      process.env.AZURE_SERVICE_REGION,
    );

    speechConfig.speechRecognitionLanguage = 'pt-BR';

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // This event will trigger when recognition had some error
    recognizer.canceled = function (s, e) {
      let str = `(cancel) Reason: ${sdk.CancellationReason[e.reason]}`;

      if (e.reason === sdk.CancellationReason.Error) {
        str += `: ${e.errorDetails}`;
      }

      logger.error(str);
    };

    // Signals that a new session has started with the speech service
    recognizer.sessionStarted = function (s, e) {
      logger.info(`(sessionStarted) SessionId: ${e.sessionId}`);
    };

    // Signals the end of a session with the speech service.
    recognizer.sessionStopped = function (s, e) {
      logger.info(`(session stopped) SessionId: ${e.sessionId}`);
    };

    recognizer.speechStartDetected = function (s, e) {
      const str = '(speechStartDetected) SessionId: ' + e.sessionId;
      logger.info(str);
    };

    return recognizer;
  }
}
