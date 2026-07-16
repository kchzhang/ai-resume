// 开发环境承接 postMessage 的「伪 background」。
// 开发环境不是作为扩展加载的，没有 chrome.runtime，故用同源 postMessage 在
// 同一上下文里承接 UI 下发的指令，复用与生产完全一致的 handleRuntimeMessage。
// 仅开发环境注册；生产构建时 isProduction 为常量 true，整块被消除。
import { isProduction } from '@/config';
import { handleRuntimeMessage, subscribeTasks } from './handler';
import type { RuntimeMessage, RuntimeResponse } from '@/types/runtime';
import { DEV_RUNTIME_CHANNEL, DEV_TASKS_CHANNEL } from './constants';

if (!isProduction) {
  window.addEventListener('message', async (e: MessageEvent) => {
    const data = e.data;
    // 仅处理 UI 下发的请求（kind==='request' 且含 message），忽略自身回环广播
    if (!data || data.channel !== DEV_RUNTIME_CHANNEL || data.kind !== 'request' || !data.message) {
      return;
    }
    const response: RuntimeResponse = await handleRuntimeMessage(data.message as RuntimeMessage);
    window.postMessage(
      { channel: DEV_RUNTIME_CHANNEL, kind: 'response', requestId: data.requestId, response },
      '*',
    );
  });

  // 模拟 chrome.storage.onChanged：任务推进时把最新列表广播给 UI
  subscribeTasks((list) => {
    window.postMessage({ channel: DEV_TASKS_CHANNEL, tasks: list }, '*');
  });
}
