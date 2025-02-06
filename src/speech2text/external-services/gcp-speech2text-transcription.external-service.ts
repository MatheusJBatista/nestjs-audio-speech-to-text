import { Injectable } from '@nestjs/common';
import { v2 as speech } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';
import { Speech2TextBase } from './speech2text.interface';

type RecognitionResult = {
  results: {
    alternatives: {
      transcript: string;
    }[];
  }[];
};

// TODO: you can use this class in a background process (lambda, pub/sub, storage trigger...)
@Injectable()
export class GCPSpeech2TextTranscriptionExternalService
  implements Speech2TextBase
{
  async execute() {
    const client = new speech.SpeechClient();

    //TODO: you can have another endpoint to upload the audio
    const audioFilePath = `gs://${process.env.GOOGLE_STORAGE_NAME}/audio-files/teste-nalfu.webm`;

    const recognizer = `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${process.env.GOOGLE_SPEECH_RECOGNIZER_LOCATION}/recognizers/${process.env.GOOGLE_SPEECH_RECOGNIZER_NAME}`;

    const workspace = `gs://${process.env.GOOGLE_STORAGE_NAME}/transcripts`;

    const audioFiles = [{ uri: audioFilePath }];
    const outputPath = {
      gcsOutputConfig: {
        uri: workspace,
      },
    };

    const transcriptionRequest = {
      recognizer: recognizer,
      config: {
        autoDecodingConfig: {},
        model: 'long',
        languageCodes: ['pt-BR'],
        features: {
          enableWordTimeOffsets: true,
          enable_word_confidence: true,
          enableAutomaticPunctuation: true,
          enableSpokenPunctuation: true,
        },
      },
      files: audioFiles,
      recognitionOutputConfig: outputPath,
    };

    const [operation] = await client.batchRecognize(transcriptionRequest);

    const [response] = await operation.promise();

    const transcriptionFileUri = response.results[audioFilePath].uri;

    return await this.mountTranscriptionFromBucketFile(transcriptionFileUri);
  }

  private async mountTranscriptionFromBucketFile(fileUri: string) {
    // removes the gs://STORAGE_NAME/ prefix
    const filename = fileUri.split(`${process.env.GOOGLE_STORAGE_NAME}/`).at(1);

    const storage = new Storage({
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
    const file = await storage
      .bucket(process.env.GOOGLE_STORAGE_NAME)
      .file(filename)
      .download();

    const fileContent: RecognitionResult = JSON.parse(file[0].toString('utf8'));

    return fileContent.results
      .map((x) => x.alternatives.at(0).transcript)
      .join('\n');
  }
}
