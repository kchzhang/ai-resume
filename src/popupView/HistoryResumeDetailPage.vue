<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from './Header.vue';
import { getMatchedResumeById } from '@/utils/resumeMatchStorage';
import type { MatchedResume } from '@/types/resumeMatch';

const route = useRoute();
const router = useRouter();
const resume = ref<MatchedResume | undefined>(undefined);
const loading = ref(true);

onMounted(async () => {
  resume.value = await getMatchedResumeById(route.params.id as string);
  loading.value = false;
});

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/\//g, '-');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
</script>

<template>
  <div class="block font-[inherit] min-h-screen bg-slate-50">
    <Header title="简历详情" :show-back="true" @back="() => router.back()" />

    <div class="p-4 space-y-4">
      <!-- 加载态 -->
      <section v-if="loading" class="flex items-center justify-center py-16">
        <span class="text-sm text-slate-400">加载中…</span>
      </section>

      <!-- 未找到 -->
      <section
        v-else-if="!resume"
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <svg class="w-12 h-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="text-sm text-slate-400">未找到该简历，可能已被删除</p>
        <button
          @click="() => router.push('/history-resumes')"
          class="h-8 px-4 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-lg transition-colors duration-150 hover:bg-sky-100"
        >
          返回列表
        </button>
      </section>

      <!-- 详情 -->
      <template v-else>
        <!-- 元信息 -->
        <section class="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium uppercase bg-slate-100 text-slate-600"
            >
              {{ resume.fileType }}
            </span>
            <h2 class="text-base font-semibold text-slate-800 truncate">{{ resume.filename }}</h2>
          </div>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt class="text-xs text-slate-400">关联规则</dt>
              <dd class="mt-0.5 text-slate-700 truncate">{{ resume.ruleName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">关联模型</dt>
              <dd class="mt-0.5 text-slate-700 truncate">{{ resume.modelName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">创建时间</dt>
              <dd class="mt-0.5 text-slate-700">{{ formatTime(resume.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-slate-400">文件大小</dt>
              <dd class="mt-0.5 text-slate-700">{{ formatSize(resume.size) }}</dd>
            </div>
          </dl>
        </section>

        <!-- 简历原文 -->
        <section class="rounded-xl bg-white border border-slate-200 p-4">
          <h3 class="text-xs font-semibold text-slate-500 mb-2">简历内容</h3>
          <p class="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
            {{ resume.content }}
          </p>
        </section>
      </template>
    </div>
  </div>
</template>
