import mammoth from 'mammoth';
import {
  FileType,
  type FileReaderStrategy,
  type FileReadOptions,
  type FileReadResult,
} from '@/types/fileReader';

/** Word (.docx) 读取策略，基于 mammoth */
export class DocxReader implements FileReaderStrategy {
  supportedType = FileType.DOCX;
  supportedExtensions = ['.docx'];

  async read(file: File | Blob, options?: FileReadOptions): Promise<FileReadResult> {
    const arrayBuffer = await file.arrayBuffer();
    const { value, messages } = await mammoth.extractRawText({ arrayBuffer });

    const metadata: Record<string, unknown> | undefined = options?.extractMetadata
      ? { warnings: messages }
      : undefined;

    return {
      filename: file instanceof File ? file.name : '',
      fileType: this.supportedType,
      content: value,
      metadata,
    };
  }
}
