export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface FileStoragePort {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(fileKey: string): Promise<void>;
}
