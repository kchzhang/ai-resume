// 传输层抽象：UI 只依赖 sendMessage()，内部按环境分流。
// 生产走 chrome.runtime.sendMessage；开发走 window.postMessage + requestId 配对回包。
import { isProduction } from '@/config';
import type { RuntimeMessage, RuntimeResponse } from '@/types/runtime';
import { DEV_RUNTIME_CHANNEL } from './constants';

export function sendMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  if (isProduction) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (resp: RuntimeResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'runtime error'));
          return;
        }
        resolve(resp);
      });
    });
  }

  return new Promise((resolve) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      // 仅处理本请求的回包（kind==='response'），忽略自身发出的请求回环
      if (
        !data ||
        data.channel !== DEV_RUNTIME_CHANNEL ||
        data.kind !== 'response' ||
        data.requestId !== requestId
      ) {
        return;
      }
      window.removeEventListener('message', onMessage);
      resolve(data.response as RuntimeResponse);
    };
    window.addEventListener('message', onMessage);
    window.postMessage(
      { channel: DEV_RUNTIME_CHANNEL, kind: 'request', requestId, message },
      '*',
    );
  });
}
