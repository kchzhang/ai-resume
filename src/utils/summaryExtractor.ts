import type { TaskSummary } from '@/types/task';

const SUMMARY_START = '<!--SUMMARY_START-->';
const SUMMARY_END = '<!--SUMMARY_END-->';

/** 从 AI 输出中解析 JSON 摘要块并剥离，返回干净的 output 和 summary */
export function extractSummary(raw: string): {
  output: string;
  summary?: TaskSummary;
} {
  const startIdx = raw.indexOf(SUMMARY_START);
  const endIdx = raw.indexOf(SUMMARY_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { output: raw };
  }

  const jsonStr = raw.slice(startIdx + SUMMARY_START.length, endIdx).trim();
  const blockStr = raw.slice(startIdx, endIdx + SUMMARY_END.length);

  try {
    const parsed = JSON.parse(jsonStr);
    // 兼容两种格式：{ "fields": {...} } 或直接 { "姓名": "张三" }
    const fields: Record<string, string> =
      parsed.fields && typeof parsed.fields === 'object'
        ? parsed.fields
        : parsed;

    if (typeof fields === 'object' && Object.keys(fields).length > 0) {
      return {
        output: raw.replace(blockStr, '').trim(),
        summary: { fields },
      };
    }
  } catch {
    // JSON 解析失败，忽略摘要块
  }

  // 解析失败时仍剥离标记（避免用户看到注释标记），但不返回 summary
  return { output: raw.replace(blockStr, '').trim() };
}
