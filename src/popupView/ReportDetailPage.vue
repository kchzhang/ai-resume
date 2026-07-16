<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from './Header.vue';
import { Stream } from '@knoxzhang/streamup';
import '@/styles/streamup.css';
import { useTaskDetail } from '@/composables/useTaskDetail';

const route = useRoute();
const router = useRouter();

const { task, loading } = useTaskDetail(route.params.id as string);

const STATUS_META: Record<string, { label: string; badge: string }> = {
  pending: { label: '排队中', badge: 'bg-slate-100 text-slate-600' },
  running: { label: '运行中', badge: 'bg-sky-100 text-sky-700' },
  success: { label: '成功', badge: 'bg-emerald-100 text-emerald-700' },
  failed: { label: '失败', badge: 'bg-rose-100 text-rose-700' },
  cancelled: { label: '已取消', badge: 'bg-zinc-100 text-zinc-500' },
};

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

// 测评报告为 markdown，交给 Stream 组件渲染
const reportContent = computed(() => task.value?.result?.output ?? '');
</script>

<template>
  <div class="block font-[inherit] min-h-screen bg-slate-50">
    <Header title="测评报告" :show-back="true" @back="goBack" />

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

      <div v-else class="space-y-4">
        <!-- 元信息 -->
        <section class="rounded-xl bg-white border border-slate-200 p-3">
          <div class="flex items-center gap-2 mb-3">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
              :class="STATUS_META[task.status].badge"
            >
              {{ STATUS_META[task.status].label }}
            </span>
            <span class="text-sm font-semibold text-slate-800 truncate">{{ task.ruleName || '未命名规则' }}</span>
          </div>
          <div class="grid grid-cols-2 gap-y-2 text-xs">
            <span class="text-slate-400">模型</span>
            <span class="text-slate-700 text-right truncate">{{ task.result?.modelName || task.modelId || '默认模型' }}</span>
            <span class="text-slate-400">创建时间</span>
            <span class="text-slate-700 text-right">{{ formatTime(task.createdAt) }}</span>
            <span v-if="task.result" class="text-slate-400">完成时间</span>
            <span v-if="task.result" class="text-slate-700 text-right">{{ formatTime(task.result.finishedAt) }}</span>
          </div>
        </section>

        <!-- 成功：测评报告 -->
        <section
          v-if="task.status === 'success' && task.result"
          class="rounded-xl bg-white border border-slate-200 p-3"
        >
          <h3 class="mb-2 text-xs font-semibold text-slate-500">测评报告</h3>
          <!-- <p
            v-if="task.result.reasoning"
            class="mb-3 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-2 leading-relaxed whitespace-pre-wrap break-words"
          >
            {{ task.result.reasoning }}
          </p> -->
          <Stream
            :source="reportContent"
            :streaming="false"
            :smooth-speed="0"
            auto-scroll
            class="text-sm text-slate-700"
          />
        </section>

        <!-- 失败 -->
        <section
          v-else-if="task.status === 'failed'"
          class="rounded-xl bg-rose-50 border border-rose-100 p-3"
        >
          <h3 class="mb-2 text-xs font-semibold text-rose-600">生成失败</h3>
          <p class="text-sm text-rose-600 leading-relaxed break-words">
            {{ task.error || '未知错误' }}
          </p>
        </section>

        <!-- 已取消 -->
        <section
          v-else-if="task.status === 'cancelled'"
          class="rounded-xl bg-zinc-50 border border-zinc-100 p-3 text-center text-sm text-zinc-500"
        >
          该任务已取消
        </section>

        <!-- 排队中 / 运行中 -->
        <section
          v-else
          class="rounded-xl bg-sky-50 border border-sky-100 p-3 text-center text-sm text-sky-600"
        >
          {{ task.status === 'running' ? '报告生成中…' : '任务排队中，请稍后再查看' }}
        </section>
      </div>
    </div>
  </div>
</template>
