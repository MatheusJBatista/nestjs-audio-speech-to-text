import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AWSS3ExternalService {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * @returns fileLocation: string
   */
  async uploadAudio(audio: Buffer, filename: string) {
    const fileLocation = `poc/${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_AUDIO_BUCKET_NAME,
      Key: fileLocation,
      Body: audio,
    });

    await this.s3Client.send(command);

    return `s3://${process.env.AWS_S3_AUDIO_BUCKET_NAME}/${fileLocation}`;
  }
}
