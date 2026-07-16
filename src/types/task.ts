import { generateId } from './promptRule';

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

/** 入队所需的输入 */
export interface TaskInput {
  text: string;
  ruleId: string;
  /** 指定模型 ID，缺省时使用激活模型 */
  modelId?: string;
}

/** AI 输出中的结构化摘要（从 JSON 摘要块解析而来） */
export interface TaskSummary {
  /** 灵活的 key-value 字段，如 { "姓名": "张三", "综合评分": "85" } */
  fields: Record<string, string>;
}

/** LLM 输出的结果（成功时填充） */
export interface TaskResult {
  output: string;
  reasoning?: string;
  modelName: string;
  finishedAt: number;
  /** 从 AI 输出中提取的结构化摘要 */
  summary?: TaskSummary;
}

/** 一条任务的完整记录，会被持久化 */
export interface TaskRecord {
  id: string;
  text: string;
  ruleId: string;
  /** 入队时快照的规则名，避免规则被改后结果对不上 */
  ruleName: string;
  /** 指定模型 ID（透传，便于展示/重跑）；缺省用激活模型 */
  modelId?: string;
  status: TaskStatus;
  result?: TaskResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export { generateId };
