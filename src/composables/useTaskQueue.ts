import { ref, type Ref } from 'vue';
import type { TaskInput, TaskRecord } from '@/types/task';
import { getTaskList } from '@/utils/taskStorage';
import { sendMessage } from '@/runtime/messaging';
import { isProduction } from '@/config';
import { DEV_TASKS_CHANNEL } from '@/runtime/constants';

// 任务引擎已迁至 background service worker（开发环境由 devBackground 承接）。
// 本组合式函数只作为 UI 控制台：通过 sendMessage() 抽象下发指令（生产走
// chrome.runtime.sendMessage，开发走 window.postMessage），并订阅任务快照刷新视图。
const STORAGE_KEY = 'ai_task_records';

const tasks: Ref<TaskRecord[]> = ref([]);
const isPaused: Ref<boolean> = ref(false);
let initialized = false;

async function refresh(): Promise<void> {
  tasks.value = await getTaskList();
}

/**
 * Vue 组合式封装：把 background 任务引擎的状态包成响应式 ref，方便 v-for 渲染。
 * 首次调用时自动初始化并恢复持久化任务。
 */
export function useTaskQueue() {
  if (!initialized) {
    initialized = true;
    // 让引擎恢复持久化任务并取回当前列表
    sendMessage({ type: 'init' })
      .then((r) => {
        if (r.tasks) tasks.value = r.tasks;
        if (r.paused !== undefined) isPaused.value = r.paused;
      })
      .catch((err) => {
        console.error('[useTaskQueue] init failed:', err);
        initialized = false; // 允许后续调用重试
      });
    // 订阅引擎写入的任务快照，任务推进时刷新 UI
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      // 生产环境：监听 chrome.storage.onChanged
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[STORAGE_KEY]) void refresh();
      });
    }
    if (!isProduction) {
      // 开发环境：监听 devBackground 广播的任务快照
      window.addEventListener('message', (e: MessageEvent) => {
        if (e.data?.channel === DEV_TASKS_CHANNEL) tasks.value = e.data.tasks;
      });
    }
  }

  return {
    tasks,
    isPaused,
    enqueue: async (input: TaskInput) => {
      const r = await sendMessage({ type: 'enqueue', input });
      await refresh();
      return r.task;
    },
    enqueueBatch: async (inputs: TaskInput[]) => {
      const r = await sendMessage({ type: 'enqueueBatch', inputs });
      await refresh();
      return r.tasks ?? [];
    },
    pause: async () => {
      await sendMessage({ type: 'pause' });
      isPaused.value = true;
    },
    resume: async () => {
      await sendMessage({ type: 'resume' });
      isPaused.value = false;
    },
    cancel: async (id: string) => {
      await sendMessage({ type: 'cancel', id });
      await refresh();
    },
    remove: async (id: string) => {
      await sendMessage({ type: 'delete', id });
      await refresh();
    },
    rerun: async (record: TaskRecord) => {
      const input: TaskInput = {
        text: record.text,
        ruleId: record.ruleId,
        modelId: record.modelId,
      };
      const r = await sendMessage({ type: 'enqueue', input });
      await refresh();
      return r.task;
    },
    clear: async (scope?: 'all' | 'finished') => {
      await sendMessage({ type: 'clear', scope: scope ?? 'all' });
      await refresh();
    },
    init: async () => {
      const r = await sendMessage({ type: 'init' });
      if (r.tasks) tasks.value = r.tasks;
      if (r.paused !== undefined) isPaused.value = r.paused;
    },
  };
}
