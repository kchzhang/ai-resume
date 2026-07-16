// 文件读取相关类型定义

/** 支持的文件类型 */
export enum FileType {
  DOCX = 'docx',
  PDF = 'pdf',
  TXT = 'txt',
  MD = 'md',
}

/** 文件读取结果 */
export interface FileReadResult {
  /** 文件名 */
  filename: string;
  /** 文件类型 */
  fileType: FileType;
  /** 提取出的纯文本内容 */
  content: string;
  /** 附加元数据（如页数、警告信息等） */
  metadata?: Record<string, unknown>;
}

/** 文件读取策略接口 */
export interface FileReaderStrategy {
  /** 该策略对应的文件类型 */
  supportedType: FileType;
  /** 该策略支持的扩展名（含点，小写，如 '.txt'） */
  supportedExtensions: string[];
  /** 读取文件并返回结果 */
  read(file: File | Blob, options?: FileReadOptions): Promise<FileReadResult>;
}

/** 文件读取选项 */
export interface FileReadOptions {
  /** 文件大小上限，单位字节，默认 10MB */
  maxSize?: number;
  /** 是否提取元数据，默认 false */
  extractMetadata?: boolean;
  /** 文本编码，仅 TXT/MD 生效，默认 'utf-8' */
  encoding?: string;
}
