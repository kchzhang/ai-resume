import { generateId, type TaskInput, type TaskRecord } from '@/types/task';
import { getRuleList } from './promptRuleStorage';
import { executeTask } from './taskExecutor';
import { saveTask, getTaskList } from './taskStorage';

type Listener = (tasks: TaskRecord[]) => void;

export interface TaskQueueOptions {
  /** 并发数，默认 1（串行） */
  concurrency?: number;
  /** 状态变更后是否自动持久化，默认 true */
  autoPersist?: boolean;
}

/**
 * 任务处理队列：
 * 1. enqueue 输入 text + ruleId
 * 2. 内部组合提示词并接入 LLM
 * 3. 结果写回 TaskRecord 并持久化
 * 支持并发控制、暂停/恢复、取消、状态订阅。
 */
export class TaskQueue {
  private tasks: TaskRecord[] = [];
  private running = 0;
  private concurrency: number;
  private autoPersist: boolean;
  private paused = false;
  private listeners = new Set<Listener>();
  private abortMap = new Map<string, AbortController>();

  constructor(options?: TaskQueueOptions) {
    this.concurrency = options?.concurrency ?? 1;
    this.autoPersist = options?.autoPersist ?? true;
  }

  /** 从持久化存储恢复任务；残留的 running 为僵尸任务标记取消，pending 保留以便恢复续跑 */
  async init(): Promise<void> {
    this.tasks = await getTaskList();
    this.tasks.forEach((t) => {
      if (t.status === 'running') t.status = 'cancelled';
    });
    this.emit();
    // 恢复后自动续跑待处理任务（若处于暂停态，pump 内部会直接返回）
    this.pump();
  }

  enqueue(input: TaskInput): TaskRecord {
    const now = Date.now();
    const task: TaskRecord = {
      id: generateId(),
      text: input.text,
      ruleId: input.ruleId,
      ruleName: '',
      modelId: input.modelId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.unshift(task);
    this.emit();
    this.pump();
    return task;
  }

  /** 批量入队：保持传入顺序，整批前置插入，统一 emit + pump */
  enqueueBatch(inputs: TaskInput[]): TaskRecord[] {
    const created: TaskRecord[] = [];
    for (const input of inputs) {
      const now = Date.now();
      const task: TaskRecord = {
        id: generateId(),
        text: input.text,
        ruleId: input.ruleId,
        ruleName: '',
        modelId: input.modelId,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      created.push(task);
    }
    this.tasks = [...created, ...this.tasks];
    this.emit();
    this.pump();
    return created;
  }

  pause(): void {
    this.paused = true;
    // 只阻止新任务开始（不 pump），在途 running 任务自然完成
  }

  resume(): void {
    this.paused = false;
    this.pump();
  }

  /** 取消任务：pending 直接标记 cancelled；running 触发 abort */
  cancel(id: string): void {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'pending') {
      task.status = 'cancelled';
      task.updatedAt = Date.now();
      this.emit();
    } else if (task.status === 'running') {
      this.abortMap.get(id)?.abort();
    }
  }

  getTasks(): TaskRecord[] {
    return [...this.tasks];
  }

  /** 是否处于暂停状态 */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * 清空任务。
   * @param scope 'all' 清空全部；'finished' 仅清空 success/failed/cancelled
   */
  clear(scope: 'all' | 'finished' = 'all'): void {
    if (scope === 'finished') {
      this.tasks = this.tasks.filter(
        (t) => t.status === 'pending' || t.status === 'running',
      );
    } else {
      this.tasks = [];
    }
    this.emit();
  }

  /** 删除单条任务：running 会先中止，其余状态直接移除 */
  remove(id: string): void {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'running') this.abortMap.get(id)?.abort();
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.emit();
  }

  /** 订阅任务列表变更，立即触发一次；返回取消订阅函数 */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getTasks());
    return () => this.listeners.delete(listener);
  }

  private pump(): void {
    if (this.paused) return;
    while (this.running < this.concurrency) {
      const next = this.tasks.find((t) => t.status === 'pending');
      if (!next) break;
      void this.run(next);
    }
  }

  private async run(task: TaskRecord): Promise<void> {
    this.running++;
    task.status = 'running';
    task.updatedAt = Date.now();
    this.emit();

    const controller = new AbortController();
    this.abortMap.set(task.id, controller);

    try {
      const rules = await getRuleList();
      const rule = rules.find((r) => r.id === task.ruleId);
      if (!rule) throw new Error('规则不存在或被删除');
      task.ruleName = rule.name;

      const result = await executeTask(task.text, rule, { signal: controller.signal }, task.modelId);
      if (controller.signal.aborted) {
        task.status = 'cancelled';
      } else {
        task.status = 'success';
        task.result = { ...result, finishedAt: Date.now() };
      }
    } catch (err) {
      if (controller.signal.aborted) {
        task.status = 'cancelled';
      } else {
        task.status = 'failed';
        task.error = err instanceof Error ? err.message : String(err);
      }
    } finally {
      task.updatedAt = Date.now();
      this.abortMap.delete(task.id);
      this.running--;
      // 若任务在执行期间被删除（remove），不再回写，避免被重新持久化
      if (this.tasks.includes(task)) {
        this.emit();
        if (this.autoPersist) await saveTask(task);
      }
      this.pump();
    }
  }

  private emit(): void {
    const snapshot = this.getTasks();
    this.listeners.forEach((l) => l(snapshot));
  }
}
