import { Injectable } from '@nestjs/common';
import { Speech2TextBase } from './speech2text.interface';
import { AWSS3ExternalService } from './aws-s3.external-service';
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import * as dayjs from 'dayjs';

@Injectable()
export class AWSTranscribeExternalService implements Speech2TextBase {
  private readonly transcribeClient: TranscribeClient;

  constructor(private readonly aWSS3ExternalService: AWSS3ExternalService) {
    this.transcribeClient = new TranscribeClient({
      region: process.env.AWS_TRANSCRIBE_REGION,
      credentials: {
        accessKeyId: process.env.AWS_TRANSCRIBE_ACCESS_KEY,
        secretAccessKey: process.env.AWS_TRANSCRIBE_SECRET_ACCESS_KEY,
      },
    });
  }

  async execute(
    audio: Buffer<ArrayBufferLike>,
    filename: string,
  ): Promise<string> {
    const fileLocation = await this.aWSS3ExternalService.uploadAudio(
      audio,
      filename,
    );

    const jobName = `${dayjs().format('DD-MM-YYYY')}-${filename}`;

    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      Media: {
        MediaFileUri: fileLocation,
      },
      LanguageCode: 'pt-BR',
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 10,
      },
      MediaFormat: 'webm',
      OutputBucketName: process.env.AWS_S3_TRANSCRIPTIONS_BUCKET_NAME,
    });

    await this.transcribeClient.send(command);

    return '';
  }
}
