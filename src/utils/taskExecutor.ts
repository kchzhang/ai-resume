import { ChatClient } from './chatClient';
import { buildMessages } from './promptBuilder';
import type { PromptRule } from '@/types/promptRule';
import type { ChatOptions, ChatChunkData } from '@/types/chat';

export interface ExecuteOptions extends ChatOptions {
  /** 流式回调（可选）；不传则走非流式 */
  onChunk?: (chunk: ChatChunkData) => void;
}

export interface ExecuteResult {
  output: string;
  reasoning?: string;
  modelName: string;
}

/**
 * 执行单条任务：组合提示词 → 调用 LLM → 返回结果。
 * 始终使用流式请求（部分 API 仅支持流式）；传入 onChunk 时实时回调 UI。
 */
export async function executeTask(
  text: string,
  rule: PromptRule,
  options?: ExecuteOptions,
  modelId?: string,
): Promise<ExecuteResult> {
  const client = modelId
    ? await ChatClient.fromModel(modelId)
    : await ChatClient.fromActiveModel();
  const messages = buildMessages(text, rule);

  let output = '';
  let reasoning = '';
  for await (const chunk of client.chatStream(messages, options)) {
    if (chunk.cancelled) break;
    if (chunk.content) output += chunk.content;
    if (chunk.reasoning_content) reasoning += chunk.reasoning_content;
    if (options?.onChunk) options.onChunk(chunk);
  }
  return { output, reasoning: reasoning || undefined, modelName: client.modelName };
}
