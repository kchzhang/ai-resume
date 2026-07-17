import type { TaskSummary } from '@/types/task';

const SUMMARY_START = '<!--SUMMARY_START-->';
const SUMMARY_END = '<!--SUMMARY_END-->';

/** 从行分隔文本中解析 fields：每行 "字段名: 值" */
function parseLineFields(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (key && value) {
      fields[key] = String(value);
    }
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

/** 从 JSON 中解析 fields（向后兼容） */
function parseJsonFields(text: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(text);
    // 兼容两种格式：{ "fields": {...} } 或直接 { "姓名": "张三" }
    const rawFields: Record<string, unknown> =
      parsed.fields && typeof parsed.fields === 'object'
        ? parsed.fields
        : parsed;

    if (typeof rawFields !== 'object' || Object.keys(rawFields).length === 0) {
      return null;
    }

    // 所有值统一转为 string（解决 JSON 中 number/string 类型不一致问题）
    const fields: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawFields)) {
      fields[key] = String(val);
    }
    return fields;
  } catch {
    return null;
  }
}

/** 从 AI 输出中解析摘要块并剥离，返回干净的 output 和 summary
 *  优先解析行分隔格式（"字段名: 值"），JSON 作为向后兼容 fallback */
export function extractSummary(raw: string): {
  output: string;
  summary?: TaskSummary;
} {
  // 使用 lastIndexOf 取最后一个摘要块（最完整的结果）
  const startIdx = raw.lastIndexOf(SUMMARY_START);
  const endIdx = raw.lastIndexOf(SUMMARY_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { output: raw };
  }

  const contentStr = raw.slice(startIdx + SUMMARY_START.length, endIdx).trim();

  // 移除所有 SUMMARY_START...SUMMARY_END 块，得到干净的输出
  const cleanOutput = raw.replace(/<!--SUMMARY_START-->[\s\S]*?<!--SUMMARY_END-->/g, '').trim();

  // 优先尝试行分隔格式解析
  const lineFields = parseLineFields(contentStr);
  if (lineFields) {
    return { output: cleanOutput, summary: { fields: lineFields } };
  }

  // fallback：尝试 JSON 格式解析（向后兼容旧数据）
  const jsonFields = parseJsonFields(contentStr);
  if (jsonFields) {
    return { output: cleanOutput, summary: { fields: jsonFields } };
  }

  // 解析失败时仍剥离标记（避免用户看到注释标记），但不返回 summary
  return { output: cleanOutput };
}
