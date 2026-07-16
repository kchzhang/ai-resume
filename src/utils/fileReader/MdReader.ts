import {
  FileType,
  type FileReaderStrategy,
  type FileReadOptions,
  type FileReadResult,
} from '@/types/fileReader';

/** Markdown 读取策略（返回原始 markdown 文本） */
export class MdReader implements FileReaderStrategy {
  supportedType = FileType.MD;
  supportedExtensions = ['.md', '.markdown'];

  async read(file: File | Blob, options?: FileReadOptions): Promise<FileReadResult> {
    const encoding = options?.encoding ?? 'utf-8';
    let content: string;

    if (encoding.toLowerCase() === 'utf-8' || encoding.toLowerCase() === 'utf8') {
      content = await file.text();
    } else {
      const buffer = await file.arrayBuffer();
      content = new TextDecoder(encoding).decode(buffer);
    }

    return {
      filename: file instanceof File ? file.name : '',
      fileType: this.supportedType,
      content,
    };
  }
}
