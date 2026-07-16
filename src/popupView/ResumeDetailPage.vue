<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Header from './Header.vue';
import { useTaskDetail } from '@/composables/useTaskDetail';

const route = useRoute();
const router = useRouter();

const { task, loading } = useTaskDetail(route.params.id as string);

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function goBack() {
  router.back();
}
</script>

<template>
  <div class="block font-[inherit] min-h-screen bg-slate-50">
    <Header title="简历详情" :show-back="true" @back="goBack" />

    <div class="p-4">
      <!-- 加载中 -->
      <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-slate-400">
        加载中…
      </div>

      <!-- 未找到 -->
      <div
        v-else-if="!task"
        class="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <p class="text-sm text-slate-400">未找到该任务</p>
        <button
          @click="goBack"
          class="h-9 px-4 text-sm font-medium text-white bg-sky-500 rounded-lg transition-all duration-150 hover:bg-sky-600 active:scale-[0.98]"
        >
          返回
        </button>
      </div>

      <!-- 内容 -->
      <div v-else class="space-y-4">
        <section class="rounded-xl bg-white border border-slate-200 p-3">
          <div class="grid grid-cols-2 gap-y-2 text-xs">
            <span class="text-slate-400">规则</span>
            <span class="text-slate-700 text-right truncate">{{ task.ruleName || '未命名规则' }}</span>
            <span class="text-slate-400">模型</span>
            <span class="text-slate-700 text-right truncate">{{ task.result?.modelName || task.modelId || '默认模型' }}</span>
            <span class="text-slate-400">创建时间</span>
            <span class="text-slate-700 text-right">{{ formatTime(task.createdAt) }}</span>
          </div>
        </section>

        <section class="rounded-xl bg-white border border-slate-200 p-3">
          <h3 class="mb-2 text-xs font-semibold text-slate-500">简历原文</h3>
          <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {{ task.text }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
