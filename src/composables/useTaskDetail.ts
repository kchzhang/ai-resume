// 任务详情统一获取层：简历详情页与报告详情页共用。
// 取值走 @/utils/taskStorage（底层为 storage.ts 抽象，生产=chrome.storage.local，
// 开发=localStorage），并订阅任务变更在两种环境下实时刷新 UI：
//   - 生产：chrome.storage.onChanged
//   - 开发：devBackground 广播的 DEV_TASKS_CHANNEL
import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { getTaskById } from '@/utils/taskStorage';
import type { TaskRecord } from '@/types/task';
import { isProduction } from '@/config';
import { DEV_TASKS_CHANNEL } from '@/runtime/constants';

const STORAGE_KEY = 'ai_task_records';

/**
 * 按 id 获取任务详情，并随引擎状态实时刷新。
 * @param id 任务 id
 */
export function useTaskDetail(id: string) {
  const task: Ref<TaskRecord | undefined> = ref(undefined);
  const loading: Ref<boolean> = ref(true);

  async function load(): Promise<void> {
    task.value = await getTaskById(id);
    loading.value = false;
  }

  function onDevMessage(e: MessageEvent): void {
    if (e.data?.channel !== DEV_TASKS_CHANNEL) return;
    const found = (e.data.tasks as TaskRecord[] | undefined)?.find((t) => t.id === id);
    if (found) task.value = found;
  }

  function onStorageChange(changes: Record<string, any>, area: string): void {
    if (area === 'local' && changes[STORAGE_KEY]) void load();
  }

  onMounted(() => {
    void load();
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onStorageChange);
    }
    if (!isProduction) {
      window.addEventListener('message', onDevMessage);
    }
  });

  onUnmounted(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.removeListener(onStorageChange);
    }
    if (!isProduction) {
      window.removeEventListener('message', onDevMessage);
    }
  });

  return { task, loading };
}
