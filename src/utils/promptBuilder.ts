import type { ChatMessage } from '@/types/chat';
import type { PromptRule } from '@/types/promptRule';

/** 追加到 system prompt 末尾的摘要指令 */
const SUMMARY_INSTRUCTION = `

【输出格式要求】
请在报告正文最前面用如下 HTML 注释包裹 JSON 格式的核心摘要字段（渲染时不会显示该注释）：
<!--SUMMARY_START-->
{"fields":{"字段名1":"值1","字段名2":"值2"}}
<!--SUMMARY_END-->
字段名和值必须严格为以下6项：姓名、年龄、专业、学历、总分、最终建议。不要添加其他字段。`;

/** 将用户输入与规则组合成对话消息：规则作为 system，用户输入作为 user */
export function buildMessages(text: string, rule: PromptRule): ChatMessage[] {
  return [
    { role: 'system', content: rule.rule + SUMMARY_INSTRUCTION },
    { role: 'user', content: text },
  ];
}

/** 生成可读的提示词预览（用于 UI 展示） */
export function buildPromptPreview(text: string, rule: PromptRule): string {
  return `【系统指令】\n${rule.rule}\n\n【用户输入】\n${text}`;
}
