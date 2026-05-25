export interface StorageInterface {
  generatePresignerUrl(path: string, expiresIn: number): Promise<string>;
  upload(path: string, file: Buffer, contentType?: string): Promise<{ path: string }>;
  download(path: string): Promise<NodeJS.ReadableStream>;
}
