import type { ModelConfig } from '@/types/model';
import { getActiveModel, getModelById } from '@/utils/modelStorage';
import type { ChatMessage, ChatOptions, ChatChunkData } from '@/types/chat';
import { isDev } from '@/config';

export class ChatClient {
  private config: ModelConfig;
  private abortController: AbortController | null = null;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  /** 当前模型名称（只读，便于结果展示） */
  get modelName(): string {
    return this.config.modelName;
  }

  /** 从当前激活的模型创建实例 */
  static async fromActiveModel(): Promise<ChatClient> {
    const model = await getActiveModel();
    if (!model) throw new Error('未找到激活的模型配置');
    return new ChatClient(model);
  }

  /** 按指定模型 ID 创建实例 */
  static async fromModel(id: string): Promise<ChatClient> {
    const model = await getModelById(id);
    if (!model) throw new Error('指定的模型不存在');
    return new ChatClient(model);
  }

  /** 流式对话（async generator，可用 for await...of 消费） */
  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncGenerator<ChatChunkData, void, undefined> {
    this.abortController = new AbortController();
    const signal = options?.signal ?? this.abortController.signal;
    let fullText = '';

    try {
      const response = await fetch(this.buildUrl(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildBody(messages, options, true)),
        signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`请求失败: ${response.status} ${text}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法获取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 保留最后一行（可能不完整）
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const parsed = this.parseSSELine(line);
          if (!parsed) continue;

          // 跳过初始化帧（role:"assistant" 且 content 和 reasoning_content 均为空）
          const { content, reasoning_content, finish_reason } = parsed;
          if (finish_reason === '' && !content && !reasoning_content) continue;

          if (content || reasoning_content) {
            const chunk: ChatChunkData = {};
            if (content) chunk.content = content;
            if (reasoning_content) chunk.reasoning_content = reasoning_content;
            fullText += content ?? '';
            yield chunk;
          }

          if (finish_reason && finish_reason !== '') {
            yield { done: true, fullText };
            return;
          }
        }
      }

      // 处理 buffer 中剩余内容
      if (buffer.trim()) {
        const parsed = this.parseSSELine(buffer);
        if (parsed && (parsed.content || parsed.reasoning_content)) {
          const chunk: ChatChunkData = {};
          if (parsed.content) chunk.content = parsed.content;
          if (parsed.reasoning_content) chunk.reasoning_content = parsed.reasoning_content;
          fullText += parsed.content ?? '';
          yield chunk;
        }
      }

      yield { done: true, fullText };
    } catch (err) {
      // 主动取消：yield 取消标记后优雅退出
      if (signal.aborted) {
        yield { done: true, cancelled: true, fullText };
        return;
      }
      throw err;
    } finally {
      this.abortController = null;
    }
  }

  /** 非流式对话 */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.abortController = new AbortController();
    const signal = options?.signal ?? this.abortController.signal;

    try {
      const response = await fetch(this.buildUrl(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildBody(messages, options, false)),
        signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`请求失败: ${response.status} ${text}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? '';
    } finally {
      this.abortController = null;
    }
  }

  /** 中止当前请求 */
  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  /** 测试模型连接是否可用（最小请求，流式） */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(this.buildUrl(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [{ role: 'user', content: 'hi' }],
          stream: true,
          max_tokens: 1,
        }),
      });

      if (!response.ok) {
        const text = (await response.text()).slice(0, 300);
        return { ok: false, message: `连接失败 (${response.status}): ${text}` };
      }

      // 流式响应：读取 SSE 流，解析首个有效数据帧
      const reader = response.body?.getReader();
      if (!reader) {
        return { ok: false, message: '连接成功，但无法读取响应流' };
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let receivedData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const parsed = this.parseSSELine(line);
          if (parsed && (parsed.content || parsed.reasoning_content || parsed.finish_reason)) {
            receivedData = true;
          }
        }
      }

      if (!receivedData) {
        return { ok: false, message: '连接成功，但返回数据异常' };
      }
      return { ok: true, message: '连接成功' };
    } catch (err) {
      return {
        ok: false,
        message: `连接失败: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  private buildUrl(): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    // 若用户已填写完整路径（已包含 /chat/completions），则直接使用，避免重复追加
    const full = /chat\/completions$/i.test(base)
      ? base
      : `${base}/chat/completions`;
    // 开发环境没有 background service worker 的 host_permissions，直接请求会被 CORS 拦截，
    // 故通过 Vite dev 代理（/llm）转发，目标 host 经 x-llm-target 头告知代理。
    if (isDev) {
      const url = new URL(full);
      return `/llm${url.pathname}${url.search}`;
    }
    return full;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${this.config.apiKey}`,
    };
    if (isDev) {
      const base = this.config.baseUrl.replace(/\/+$/, '');
      const full = /chat\/completions$/i.test(base) ? base : `${base}/chat/completions`;
      headers['x-llm-target'] = new URL(full).host;
    }
    return headers;
  }

  private buildBody(
    messages: ChatMessage[],
    options?: ChatOptions,
    stream?: boolean,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.config.modelName,
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: stream ?? true,
    };
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.max_tokens !== undefined) body.max_tokens = options.max_tokens;
    return body;
  }

  /** 解析单行 SSE 数据，返回 delta 中的 content/reasoning_content/finish_reason */
  private parseSSELine(
    line: string,
  ): { content?: string; reasoning_content?: string; finish_reason?: string } | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return null;

    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') return { finish_reason: 'stop' };

    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta;
      const finish_reason = json.choices?.[0]?.finish_reason ?? '';
      if (!delta) return null;
      return {
        content: delta.content ?? undefined,
        reasoning_content: delta.reasoning_content ?? undefined,
        finish_reason,
      };
    } catch {
      return null;
    }
  }
}
