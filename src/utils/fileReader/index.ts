import {
  type FileReaderStrategy,
  type FileReadOptions,
  type FileReadResult,
} from '@/types/fileReader';
import { TxtReader } from './TxtReader';
import { MdReader } from './MdReader';
import { DocxReader } from './DocxReader';
import { PdfReader } from './PdfReader';

/**
 * 文件读取管理器
 * 基于策略模式，根据文件扩展名自动路由到对应的读取策略。
 */
export class FileReadManager {
  /** 扩展名 -> 策略 映射 */
  private strategies = new Map<string, FileReaderStrategy>();
  /** 默认文件大小上限：10MB */
  private defaultMaxSize = 10 * 1024 * 1024;

  constructor() {
    this.register(new TxtReader());
    this.register(new MdReader());
    this.register(new DocxReader());
    this.register(new PdfReader());
  }

  /** 注册一个读取策略（可用于扩展新格式） */
  register(strategy: FileReaderStrategy): void {
    for (const ext of strategy.supportedExtensions) {
      this.strategies.set(ext.toLowerCase(), strategy);
    }
  }

  /** 读取文件，返回统一结果 */
  async read(file: File | Blob, options?: FileReadOptions): Promise<FileReadResult> {
    const maxSize = options?.maxSize ?? this.defaultMaxSize;
    if (file.size > maxSize) {
      throw new Error(
        `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB 超过上限 ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const filename = file instanceof File ? file.name : '';
    const ext = this.getExtension(filename);
    if (!ext) {
      throw new Error(`无法识别文件扩展名：${filename || '(空文件名)'}`);
    }

    const strategy = this.strategies.get(ext);
    if (!strategy) {
      throw new Error(
        `不支持的文件类型：${ext}，当前支持：${this.supportedExtensions().join(', ')}`,
      );
    }

    return strategy.read(file, options);
  }

  /** 判断某文件名是否被支持 */
  supports(filename: string): boolean {
    const ext = this.getExtension(filename);
    return ext !== null && this.strategies.has(ext);
  }

  /** 返回所有支持的扩展名 */
  supportedExtensions(): string[] {
    return Array.from(this.strategies.keys());
  }

  /** 从文件名提取小写扩展名（含点），无扩展名返回 null */
  private getExtension(filename: string): string | null {
    const match = /\.[^.\\/]+$/.exec(filename);
    return match ? match[0].toLowerCase() : null;
  }
}

/** 单例，供全局直接使用 */
export const fileReadManager = new FileReadManager();

export * from '@/types/fileReader';
