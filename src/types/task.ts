import { generateId } from './promptRule';

export type TaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

/** 入队所需的输入 */
export interface TaskInput {
  text: string;
  ruleId: string;
  /** 指定模型 ID，缺省时使用激活模型 */
  modelId?: string;
}

/** LLM 输出的结果（成功时填充） */
export interface TaskResult {
  output: string;
  reasoning?: string;
  modelName: string;
  finishedAt: number;
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
