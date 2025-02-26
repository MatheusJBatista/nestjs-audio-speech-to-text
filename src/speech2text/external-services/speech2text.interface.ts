export interface Speech2TextBase {
  execute(
    audio: Buffer<ArrayBufferLike>,
    filename?: string,
  ): Promise<string | string[]>;
}
