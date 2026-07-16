import {
  FileType,
  type FileReaderStrategy,
  type FileReadOptions,
  type FileReadResult,
} from '@/types/fileReader';

/** TXT 纯文本读取策略 */
export class TxtReader implements FileReaderStrategy {
  supportedType = FileType.TXT;
  supportedExtensions = ['.txt', '.text'];

  async read(file: File | Blob, options?: FileReadOptions): Promise<FileReadResult> {
    const encoding = options?.encoding ?? 'utf-8';
    let content: string;

    // 默认 utf-8 直接用原生 API，其它编码用 TextDecoder
    if (encoding.toLowerCase() === 'utf-8' || encoding.toLowerCase() === 'utf8') {
      content = await file.text();
    } else {
      const buffer = await file.arrayBuffer();
      content = new TextDecoder(encoding).decode(buffer);
    }

    return {
      filename: getFilename(file),
      fileType: this.supportedType,
      content,
    };
  }
}

function getFilename(file: File | Blob): string {
  return file instanceof File ? file.name : '';
}
