// Chrome 插件 background service worker
// 同时承担两件事：
//   1. 点击工具栏图标时在新标签页打开扩展页面
//   2. 作为常驻的「任务执行引擎」：在后台真正发起模型请求（拥有 host_permissions，
//      可绕过 CORS，且不会因 popup/标签页关闭而中断在途请求）
import { handleRuntimeMessage } from '@/runtime/handler';
import type { RuntimeMessage, RuntimeResponse } from '@/types/runtime';

console.log('Background service worker loaded');

// 点击工具栏图标时，在新标签页打开扩展页面
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// 任务执行引擎已抽离到 @/runtime/handler（共享层）。
// 生产环境通过 chrome.runtime.onMessage 承接 UI 指令，行为保持不变。
chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse: (resp: RuntimeResponse) => void) => {
    handleRuntimeMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    // 返回 true 表示将异步调用 sendResponse
    return true;
  },
);
