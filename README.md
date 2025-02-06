## Description

This project transform audio files into transcriptions. The best solution between google and azure is the azure(on the current date i create this POC). The azure solution i made for webm audio files, i transform the audio to wav using ffmpeg and send to azure service. Maybe it works with other audio files if you change the ffmpeg instructions [Change instruction here](/src/speech2text/external-services/azure-speech2text-conversation-transcriber.external-service%20copy.ts#L76)

## Project setup

```bash
$ pnpm install
```

## Env Table

```bash
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_PROJECT_ID=
GOOGLE_STORAGE_NAME=
GOOGLE_SPEECH_RECOGNIZER_LOCATION=
GOOGLE_SPEECH_RECOGNIZER_NAME=
AZURE_SUBSCRIPTION_KEY=
AZURE_SERVICE_REGION=
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Support Nest

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
