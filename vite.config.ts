import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import type { IncomingMessage } from "http";
// import sourcemaps from 'rollup-plugin-sourcemaps';
// import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 9527,
    // 开发环境代理：把 LLM 请求转发到目标 host，绕过浏览器 CORS 限制
    // （生产环境由 background service worker 的 host_permissions 处理，无需代理）。
    // 目标 host 由前端通过 x-llm-target 请求头动态指定。
    proxy: {
      '/llm': {
        target: 'https://copilot.tencent.com',
        changeOrigin: true,
        secure: true,
        // http-proxy 运行时支持 router，但 Vite 的 ProxyOptions 类型未暴露该字段
        // @ts-expect-error router 是 http-proxy 的有效运行时选项
        router: (req: IncomingMessage) => {
          const target = req.headers['x-llm-target'];
          const host = Array.isArray(target) ? target[0] : target;
          return host ? `https://${host}` : 'https://copilot.tencent.com';
        },
        rewrite: (path) => path.replace(/^\/llm/, ''),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1024 * 10,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("pdfjs-dist")) return "pdfjs";
            if (id.includes("shiki") || id.includes("markdown-it") || id.includes("@shikijs")) {
              return "markdown";
            }
            if (id.includes("mammoth")) return "mammoth";
            if (id.includes("vue") || id.includes("@vue") || id.includes("vue-router")) {
              return "vue";
            }
            return "vendor";
          }
        },
      },
    },
  },
  plugins: [vue(), tailwindcss()],
});
