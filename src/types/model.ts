export type ModelProvider =
  | 'openai' | 'anthropic' | 'deepseek' | 'zhipu' | 'moonshot' | 'tencent'
  | 'google' | 'xai' | 'mistral' | 'groq' | 'openrouter' | 'ollama'
  | 'alibaba' | 'baidu' | 'volcengine' | 'minimax' | 'siliconflow'
  | 'custom';

export interface ProviderPreset {
  key: ModelProvider;
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  baseUrl: string;
  modelName: string;
  apiKey: string;
}

export interface ModelConfigStore {
  models: ModelConfig[];
  activeModelId: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { key: 'openai', label: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { key: 'anthropic', label: 'Anthropic', defaultBaseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-20250514' },
  { key: 'deepseek', label: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  { key: 'zhipu', label: '智谱 AI', defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4' },
  { key: 'moonshot', label: 'Moonshot', defaultBaseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
  { key: 'tencent', label: '腾讯 Copilot', defaultBaseUrl: 'https://copilot.tencent.com/v2', defaultModel: 'glm-5.0' },
  // 新增主流厂商（均为 OpenAI 兼容端点）
  { key: 'google', label: 'Google Gemini', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-2.0-flash' },
  { key: 'xai', label: 'xAI (Grok)', defaultBaseUrl: 'https://api.x.ai/v1', defaultModel: 'grok-3' },
  { key: 'mistral', label: 'Mistral AI', defaultBaseUrl: 'https://api.mistral.ai/v1', defaultModel: 'mistral-large-latest' },
  { key: 'groq', label: 'Groq', defaultBaseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  { key: 'openrouter', label: 'OpenRouter', defaultBaseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o' },
  { key: 'ollama', label: 'Ollama (本地)', defaultBaseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3' },
  { key: 'alibaba', label: '阿里云百炼 (通义千问)', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max' },
  { key: 'baidu', label: '百度智能云 (文心一言)', defaultBaseUrl: 'https://qianfan.baidubce.com/v2', defaultModel: 'ernie-4.0-8k' },
  { key: 'volcengine', label: '火山引擎 (豆包)', defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-seed-1.6' },
  { key: 'minimax', label: 'MiniMax', defaultBaseUrl: 'https://api.minimax.chat/v1', defaultModel: 'abab6.5s-chat' },
  { key: 'siliconflow', label: '硅基流动', defaultBaseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  { key: 'custom', label: '自定义', defaultBaseUrl: '', defaultModel: '' },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '••••••••';
  return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
}
