import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Speech2TextUseCase } from '../use-cases/speec2text.use-case';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class Speech2textController {
  constructor(private readonly appService: Speech2TextUseCase) {}

  @Post('/google')
  async speech2TextFromGCP() {
    return await this.appService.execute({
      type: 'gcp',
    });
  }

  @Post('/microsoft')
  @UseInterceptors(FileInterceptor('audio'))
  async speech2TextFromAzure(@UploadedFile() file: Express.Multer.File) {
    return await this.appService.execute({
      type: 'azureDiarization',
      audio: file.buffer,
    });
  }

  @Post('/aws')
  @UseInterceptors(FileInterceptor('audio'))
  async speech2TextFromAWS(@UploadedFile() file: Express.Multer.File) {
    return await this.appService.execute({
      type: 'aws',
      audio: file.buffer,
      filename: file.originalname || file.filename,
    });
  }
}
