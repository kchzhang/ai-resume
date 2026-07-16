import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
// Vite 会将 worker 作为独立资源打包并返回其 URL
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  FileType,
  type FileReaderStrategy,
  type FileReadOptions,
  type FileReadResult,
} from '@/types/fileReader';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl;

/** PDF 读取策略，基于 pdfjs-dist */
export class PdfReader implements FileReaderStrategy {
  supportedType = FileType.PDF;
  supportedExtensions = ['.pdf'];

  async read(file: File | Blob, options?: FileReadOptions): Promise<FileReadResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const lines: string[] = [];
      let line = '';
      let prevY: number | null = null;
      for (const item of textContent.items) {
        if (!('str' in item)) continue;
        const t = item as TextItem;
        // 用 transform 的 Y 坐标兜底判断换行（hasEOL 缺失时）
        const y = Array.isArray(t.transform) ? t.transform[5] : null;
        if (prevY !== null && y !== null && Math.abs(y - prevY) > 1 && line) {
          lines.push(line);
          line = '';
        }
        line += t.str;
        if (t.hasEOL) {
          lines.push(line);
          line = '';
        }
        if (y !== null) prevY = y;
      }
      if (line) lines.push(line);

      // 合并多余空行，避免抽取出大片空白
      const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      pageTexts.push(text);
    }

    const metadata: Record<string, unknown> | undefined = options?.extractMetadata
      ? { pageCount: pdf.numPages }
      : undefined;

    return {
      filename: file instanceof File ? file.name : '',
      fileType: this.supportedType,
      content: pageTexts.join('\n\n'),
      metadata,
    };
  }
}
