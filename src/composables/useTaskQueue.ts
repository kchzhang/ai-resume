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
let initPromise: Promise<void> | null = null;
let listenerRegistered = false;

async function refresh(): Promise<void> {
  tasks.value = await getTaskList();
}

/** 注册存储变更与开发环境广播监听器（只执行一次） */
function registerListeners(): void {
  if (listenerRegistered) return;
  listenerRegistered = true;
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY]) void refresh();
    });
  }
  if (!isProduction) {
    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data?.channel === DEV_TASKS_CHANNEL) tasks.value = e.data.tasks;
    });
  }
}

/** 确保引擎已初始化；并发调用共享同一 Promise，失败时清除以允许重试 */
async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      registerListeners();
      const r = await sendMessage({ type: 'init' });
      if (r.tasks) tasks.value = r.tasks;
      if (r.paused !== undefined) isPaused.value = r.paused;
    })();
  }
  try {
    await initPromise;
  } catch (err) {
    console.error('[useTaskQueue] init failed:', err);
    initPromise = null; // 清除失败 Promise，允许后续调用重试
    throw err;
  }
}

/**
 * Vue 组合式封装：把 background 任务引擎的状态包成响应式 ref，方便 v-for 渲染。
 * 所有操作先 await ensureInit() 确保引擎就绪，再下发指令。
 */
export function useTaskQueue() {
  return {
    tasks,
    isPaused,
    enqueue: async (input: TaskInput) => {
      await ensureInit();
      const r = await sendMessage({ type: 'enqueue', input });
      if (r.paused !== undefined) isPaused.value = r.paused;
      await refresh();
      return r.task;
    },
    enqueueBatch: async (inputs: TaskInput[]) => {
      await ensureInit();
      const r = await sendMessage({ type: 'enqueueBatch', inputs });
      if (r.paused !== undefined) isPaused.value = r.paused;
      await refresh();
      return r.tasks ?? [];
    },
    pause: async () => {
      await ensureInit();
      await sendMessage({ type: 'pause' });
      isPaused.value = true;
    },
    resume: async () => {
      await ensureInit();
      await sendMessage({ type: 'resume' });
      isPaused.value = false;
    },
    cancel: async (id: string) => {
      await ensureInit();
      await sendMessage({ type: 'cancel', id });
      await refresh();
    },
    remove: async (id: string) => {
      await ensureInit();
      await sendMessage({ type: 'delete', id });
      await refresh();
    },
    rerun: async (record: TaskRecord) => {
      await ensureInit();
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
      await ensureInit();
      await sendMessage({ type: 'clear', scope: scope ?? 'all' });
      await refresh();
    },
    /** 显式重新初始化：清除旧 Promise，强制重建并等待完成 */
    init: async () => {
      initPromise = null;
      await ensureInit();
    },
  };
}
