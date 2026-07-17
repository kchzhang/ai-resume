// 共享的任务引擎指令处理层。
// production 的 background service worker 与开发环境的 devBackground 都调用本模块，
// 保证指令处理逻辑零分叉、生成行为完全一致。
// 存储统一走 storage.ts 抽象：生产等价于 chrome.storage.local，开发走 localStorage。
import { TaskQueue } from '@/utils/taskQueue';
import { saveTaskList } from '@/utils/taskStorage';
import { getStorageData, setStorageData } from '@/utils/storage';
import type { TaskRecord } from '@/types/task';
import type { RuntimeMessage, RuntimeResponse } from '@/types/runtime';

const PAUSED_KEY = 'ai_queue_paused';

const queue = new TaskQueue({ concurrency: 2, autoPersist: false });
let initPromise: Promise<TaskRecord[]> | null = null;

async function ensureInit(): Promise<TaskRecord[]> {
  // 并发锁：多条消息同时到达时共享同一个 init Promise，避免重复初始化
  if (!initPromise) {
    initPromise = (async () => {
      // 先恢复 paused 状态，避免 init 的 pump 在错误状态下自动续跑
      const result = (await getStorageData(PAUSED_KEY)) as Record<string, any> | null;
      // 兼容两种存储形态：chrome.storage.local 返回 { ai_queue_paused: {...} }，
      // localStorage 直接返回数据本身 { paused: ... }
      const paused = result?.paused ?? result?.ai_queue_paused?.paused;
      if (paused) queue.pause();

      // 先恢复持久化任务，再订阅；否则 subscribe 的立即触发会把空列表写回 storage，
      // 覆盖掉 ai_task_records 中已有的任务（每次引擎重启都会清空历史）
      await queue.init();
      // 串行持久化：每次 emit 触发的写入排队等前一次完成后再执行，
      // 避免 fire-and-forget 并发写入导致旧快照覆盖新快照（竞态条件）。
      let persistPromise: Promise<void> = Promise.resolve();
      queue.subscribe((list: TaskRecord[]) => {
        persistPromise = persistPromise.then(() => saveTaskList(list));
      });
      return queue.getTasks();
    })();
  }
  try {
    return await initPromise;
  } catch (err) {
    // 初始化失败时清除 Promise，允许后续消息重试
    initPromise = null;
    throw err;
  }
}

export async function handleRuntimeMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  // 每条消息都先确保队列已初始化并订阅持久化，否则 dev 环境首条 init 消息因动态导入
  // 时序被 postMessage 丢失后，enqueue 会在无订阅者的全新队列上跑，任务不落盘。
  await ensureInit();
  switch (message.type) {
    case 'init':
      return { ok: true, tasks: queue.getTasks(), paused: queue.isPaused() };
    case 'enqueue': {
      const task = queue.enqueue(message.input);
      if (queue.isPaused()) {
        queue.resume();
        void setStorageData(PAUSED_KEY, { paused: false });
      }
      return { ok: true, task, paused: queue.isPaused() };
    }
    case 'enqueueBatch': {
      const tasks = queue.enqueueBatch(message.inputs);
      if (queue.isPaused()) {
        queue.resume();
        void setStorageData(PAUSED_KEY, { paused: false });
      }
      return { ok: true, tasks, paused: queue.isPaused() };
    }
    case 'pause':
      queue.pause();
      void setStorageData(PAUSED_KEY, { paused: true });
      return { ok: true, paused: true };
    case 'resume':
      queue.resume();
      void setStorageData(PAUSED_KEY, { paused: false });
      return { ok: true, paused: false };
    case 'cancel':
      queue.cancel(message.id);
      return { ok: true };
    case 'delete':
      queue.remove(message.id);
      return { ok: true };
    case 'clear':
      queue.clear(message.scope ?? 'all');
      return { ok: true };
    default:
      return { ok: false, error: 'unknown message type' };
  }
}

/** 订阅任务列表变更（开发环境用来向 UI 广播最新快照） */
export function subscribeTasks(listener: (tasks: TaskRecord[]) => void): () => void {
  return queue.subscribe(listener);
}
