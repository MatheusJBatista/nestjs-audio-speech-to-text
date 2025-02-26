import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GCPSpeech2TextTranscriptionExternalService } from './external-services/gcp-speech2text-transcription.external-service';
import { Speech2TextUseCase } from './use-cases/speec2text.use-case';
import { Speech2textController } from './controllers/speech2text.controller';
import { AzureSpeech2TextTranscriptionExternalService } from './external-services/azure-speech2text-speech-recognizer.external-service';
import { AzureSpeech2TextConversationTranscriberExternalService } from './external-services/azure-speech2text-conversation-transcriber.external-service copy';
import { WhisperTranscriberResolver } from './external-services/whisper-transcribe.external-service';
import { AWSS3ExternalService } from './external-services/aws-s3.external-service';
import { AWSTranscribeExternalService } from './external-services/aws-transcribe.external-service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [Speech2textController],
  providers: [
    GCPSpeech2TextTranscriptionExternalService,
    AzureSpeech2TextTranscriptionExternalService,
    AzureSpeech2TextConversationTranscriberExternalService,
    WhisperTranscriberResolver,
    AWSS3ExternalService,
    AWSTranscribeExternalService,
    Speech2TextUseCase,
  ],
})
export class Speech2textModule {}
