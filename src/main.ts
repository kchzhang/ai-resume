import { createApp } from "vue";
import "./styles/tailwind.css";
import App from "./popupView/App.vue";
import router from "./popupView/router";
import { isDev } from "@/config";

async function bootstrap(): Promise<void> {
  if (isDev) {
    // 开发环境没有 background service worker，用同源 postMessage 承接指令。
    // 必须在挂载前 await，确保监听器就绪，避免首条 init 消息因时序丢失而不落盘。
    await import("@/runtime/devBackground");
  }
  createApp(App).use(router).mount("#app");
}

void bootstrap();
