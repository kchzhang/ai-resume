# ai-resume

基于 AI 的简历筛选浏览器插件 —— 根据岗位职责与要求，自动匹配和评估简历。

## 功能概览

- **简历解析**：支持 PDF、Word 等格式文件，提取纯文本内容
- **规则驱动筛选**：自定义 Prompt 规则，描述岗位要求，AI 按规则评估简历匹配度
- **多模型支持**：接入 20+ LLM 厂商（OpenAI、DeepSeek、智谱、Anthropic、腾讯 Copilot、阿里通义千问、百度文心一言、火山引擎豆包、Ollama 等），统一使用 OpenAI 兼容接口
- **任务队列**：简历筛选任务入队执行，支持批量处理、重跑、取消
- **历史记录**：保存所有筛选结果，随时回溯查看

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite 7（双配置：主页面 + Background Service Worker） |
| 样式 | Tailwind CSS 4 |
| 路由 | Vue Router 5 |
| PDF 解析 | pdfjs-dist |
| Word 解析 | mammoth |
| Markdown 渲染 | markdown-it + shiki（代码高亮） |
| 虚拟滚动 | @tanstack/vue-virtual |
| LLM 流式调用 | @knoxzhang/streamup |

## 项目结构

```
ai-resume/
├── public/
│   ├── images/                  # 插件图标资源
│   └── manifest.json            # Chrome Manifest V3 配置
├── src/
│   ├── background/
│   │   └── main.ts              # Background Service Worker 入口
│   ├── composables/
│   │   ├── useTaskDetail.ts     # 任务详情逻辑
│   │   └── useTaskQueue.ts      # 任务队列逻辑
│   ├── config/
│   │   └── index.ts             # 环境判断（dev / production）
│   ├── contentView/             # 内容视图组件（简历展示等）
│   ├── icons/                   # 图标组件库
│   ├── insert/                  # 内容脚本注入
│   ├── popupView/               # 主界面（页面 + 路由）
│   │   ├── HomeView.vue         # 首页
│   │   ├── ResumeMatchPage.vue  # 简历匹配页
│   │   ├── ResumeDetailPage.vue # 简历详情页
│   │   ├── PromptRulePage.vue   # 规则管理页
│   │   ├── SettingsPage.vue     # 设置页（模型配置）
│   │   ├── HistoryResumeListPage.vue   # 历史简历列表
│   │   ├── HistoryResumeDetailPage.vue # 历史简历详情
│   │   ├── ReportDetailPage.vue        # 报告详情
│   │   └── router.ts            # 路由定义
│   │   └── App.vue              # 应用根组件
│   ├── runtime/
│   │   ├── constants.ts         # 开发环境消息通道常量
│   │   ├── handler.ts           # 任务执行引擎（共享层）
│   │   ├── messaging.ts         # 消息通信
│   │   └── devBackground.ts     # 开发环境 Background 替代
│   ├── types/
│   │   ├── chat.ts              # LLM 对话类型
│   │   ├── fileReader.ts        # 文件读取类型
│   │   ├── model.ts             # 模型配置类型 + 厂商预设
│   │   ├── promptRule.ts        # Prompt 规则类型
│   │   ├── resumeMatch.ts       # 简历匹配记录类型
│   │   ├── runtime.ts           # 插件运行时消息类型
│   │   ├── task.ts              # 任务类型
│   │   └── streamup.d.ts        # streamup 类型声明
│   ├── utils/                   # 工具函数
│   ├── styles/
│   │   └── tailwind.css         # Tailwind 入口样式
│   ├── main.ts                  # Vue 应用入口
│   └── vite-env.d.ts            # Vite 环境类型声明
├── vite.config.ts               # 主页面构建配置
├── vite.background.config.ts    # Background Service Worker 构建配置（CJS）
├── postcss-add-important.ts     # PostCSS 插件
├── index.html                   # 入口 HTML
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── pnpm-lock.yaml
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发环境在 `localhost:9527` 启动，没有 Chrome Background Service Worker，使用 `postMessage` 模拟插件消息通信。LLM 请求通过 Vite 代理转发（`/llm` 路径），自动根据 `x-llm-target` 请求头路由到目标厂商，绕过浏览器 CORS 限制。

### 构建

```bash
pnpm build
```

构建分两步：
1. `vue-tsc` 类型检查
2. `vite build`（主页面） + `vite build`（Background Service Worker，输出 `background.js`，CJS 格式）

构建产物可直接作为 Chrome 扩展加载。

## 安装为 Chrome 扩展

1. 执行 `pnpm build`
2. 打开 Chrome → `chrome://extensions/` → 开启「开发者模式」
3. 点击「加载已解压的扩展程序」→ 选择项目根目录下的 `dist` 文件夹
4. 点击工具栏图标即可在新标签页打开应用

## 支持的 LLM 厂商

| 厂商 | 默认模型 |
|------|----------|
| OpenAI | gpt-4o |
| Anthropic | claude-sonnet-4 |
| DeepSeek | deepseek-chat |
| 智谱 AI | glm-4 |
| Moonshot | moonshot-v1-8k |
| 腾讯 Copilot | glm-5.0 |
| Google Gemini | gemini-2.0-flash |
| xAI (Grok) | grok-3 |
| Mistral AI | mistral-large-latest |
| Groq | llama-3.3-70b-versatile |
| OpenRouter | openai/gpt-4o |
| Ollama (本地) | llama3 |
| 阿里云百炼 (通义千问) | qwen-max |
| 百度智能云 (文心一言) | ernie-4.0-8k |
| 火山引擎 (豆包) | doubao-seed-1.6 |
| MiniMax | abab6.5s-chat |
| 基流动 | deepseek-ai/DeepSeek-V3 |
| 自定义 | — |

所有厂商均使用 OpenAI 兼容 API 格式，配置 `baseUrl` + `apiKey` + `modelName` 即可接入。

## 架构设计

### 双环境运行

- **生产环境**：通过 Chrome Manifest V3 的 Background Service Worker 发起 LLM 请求，利用 `host_permissions` 绕过 CORS，请求不受页面生命周期影响
- **开发环境**：使用同源 `postMessage` 模拟 Background，LLM 请求通过 Vite dev server 代理转发

### 任务执行引擎

任务引擎位于 `src/runtime/handler.ts`，生产环境由 `chrome.runtime.onMessage` 驱动，开发环境由 `postMessage` 驱动，核心逻辑共享。

### 数据存储

使用 Chrome `storage` API 持久化模型配置、Prompt 规则、简历匹配记录和任务记录。
