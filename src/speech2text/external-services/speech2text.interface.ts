export interface Speech2TextBase {
  execute(audio: Buffer<ArrayBufferLike>): Promise<string | string[]>;
}
