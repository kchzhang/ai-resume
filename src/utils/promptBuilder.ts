import type { ChatMessage } from '@/types/chat';
import type { PromptRule } from '@/types/promptRule';

/** 将用户输入与规则组合成对话消息：规则作为 system，用户输入作为 user */
export function buildMessages(text: string, rule: PromptRule): ChatMessage[] {
  return [
    { role: 'system', content: rule.rule },
    { role: 'user', content: text },
  ];
}

/** 生成可读的提示词预览（用于 UI 展示） */
export function buildPromptPreview(text: string, rule: PromptRule): string {
  return `【系统指令】\n${rule.rule}\n\n【用户输入】\n${text}`;
}
