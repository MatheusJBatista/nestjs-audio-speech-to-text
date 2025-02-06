import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GCPSpeech2TextTranscriptionExternalService } from './external-services/gcp-speech2text-transcription.external-service';
import { Speech2TextUseCase } from './use-cases/speec2text.use-case';
import { Speech2textController } from './controllers/speech2text.controller';
import { AzureSpeech2TextTranscriptionExternalService } from './external-services/azure-speech2text-speech-recognizer.external-service';
import { AzureSpeech2TextConversationTranscriberExternalService } from './external-services/azure-speech2text-conversation-transcriber.external-service copy';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [Speech2textController],
  providers: [
    GCPSpeech2TextTranscriptionExternalService,
    AzureSpeech2TextTranscriptionExternalService,
    AzureSpeech2TextConversationTranscriberExternalService,
    Speech2TextUseCase,
  ],
})
export class Speech2textModule {}
