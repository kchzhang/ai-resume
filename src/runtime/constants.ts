// 开发环境下用于 window.postMessage 通信的通道名，避免魔法字符串。
// 这些文件仅在 !isProduction 分支被引用，生产构建时会被 tree-shake 消除。
export const DEV_RUNTIME_CHANNEL = 'ai-resume-dev-runtime';
export const DEV_TASKS_CHANNEL = 'ai-resume-dev-tasks';
