import { getStorageData, setStorageData } from './storage';
import type { TaskRecord } from '@/types/task';

const STORAGE_KEY = 'ai_task_records';

interface TaskStore {
  tasks: TaskRecord[];
}

async function getStore(): Promise<TaskStore> {
  const result = await getStorageData(STORAGE_KEY) as Record<string, any> | null;
  // chrome.storage.local 返回 { key: data }，localStorage 返回 data 本身
  const data = result?.[STORAGE_KEY] || result;
  if (data && typeof data === 'object' && 'tasks' in data) {
    return { tasks: data.tasks };
  }
  return { tasks: [] };
}

async function saveStore(store: TaskStore): Promise<void> {
  await setStorageData(STORAGE_KEY, store);
}

/** 新增或更新一条任务记录（按 id 去重，新的排前面） */
export async function saveTask(task: TaskRecord): Promise<void> {
  const store = await getStore();
  const idx = store.tasks.findIndex((t) => t.id === task.id);
  if (idx === -1) store.tasks.unshift(task);
  else store.tasks[idx] = task;
  await saveStore(store);
}

/** 获取全部任务记录 */
export async function getTaskList(): Promise<TaskRecord[]> {
  return (await getStore()).tasks;
}

/** 按 id 获取单条任务记录 */
export async function getTaskById(id: string): Promise<TaskRecord | undefined> {
  const { tasks } = await getStore();
  return tasks.find((t) => t.id === id);
}

/** 清空全部任务记录 */
export async function clearTasks(): Promise<void> {
  await saveStore({ tasks: [] });
}

/** 全量覆盖任务记录（供 background 在每次状态变更后持久化最新快照） */
export async function saveTaskList(tasks: TaskRecord[]): Promise<void> {
  await setStorageData(STORAGE_KEY, { tasks });
}
