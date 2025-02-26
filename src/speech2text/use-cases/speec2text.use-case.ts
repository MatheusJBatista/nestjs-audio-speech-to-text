import { Injectable } from '@nestjs/common';
import { GCPSpeech2TextTranscriptionExternalService } from '../external-services/gcp-speech2text-transcription.external-service';
import { AzureSpeech2TextTranscriptionExternalService } from '../external-services/azure-speech2text-speech-recognizer.external-service';
import { AzureSpeech2TextConversationTranscriberExternalService } from '../external-services/azure-speech2text-conversation-transcriber.external-service copy';
import { WhisperTranscriberResolver } from '../external-services/whisper-transcribe.external-service';
import { AWSTranscribeExternalService } from '../external-services/aws-transcribe.external-service';

type Input = {
  type: 'gcp' | 'azure' | 'azureDiarization' | 'whisper' | 'aws';
  audio?: Buffer<ArrayBufferLike>;
  filename?: string;
};

@Injectable()
export class Speech2TextUseCase {
  constructor(
    private readonly gcpSpeech2Text: GCPSpeech2TextTranscriptionExternalService,
    private readonly azureSpeech2Text: AzureSpeech2TextTranscriptionExternalService,
    // using the SpeechRecognizer i cannot retrieve the speakerId(diarization)
    // so i create a new integration using the conversation transcriber API that's allow me to diarize the audio
    private readonly azureConversationTranscriber: AzureSpeech2TextConversationTranscriberExternalService,
    private readonly whisperTranscribe: WhisperTranscriberResolver,
    private readonly awsTranscribe: AWSTranscribeExternalService,
  ) {}

  providers = {
    gcp: this.gcpSpeech2Text,
    azure: this.azureSpeech2Text,
    azureDiarization: this.azureConversationTranscriber,
    whisper: this.whisperTranscribe,
    aws: this.awsTranscribe,
  };

  async execute(input: Input): Promise<string | string[]> {
    return await this.providers[input.type].execute(
      input.audio,
      input.filename,
    );
  }
}
