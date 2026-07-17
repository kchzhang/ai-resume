<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Header from './Header.vue';
import ReportFieldCard from './components/ReportFieldCard.vue';
import { IconEye, IconRefresh, IconTrash } from '@/icons';
import { useRouter } from 'vue-router';
import { useTaskQueue } from '@/composables/useTaskQueue';
import type { TaskRecord, TaskStatus } from '@/types/task';
import { getModelList } from '@/utils/modelStorage';

const router = useRouter();
const { tasks, isPaused, pause, resume, cancel, clear, rerun, remove, init } = useTaskQueue();

const modelNameMap = ref<Record<string, string>>({});

onMounted(async () => {
  await init();
  const modelList = await getModelList();
  modelNameMap.value = modelList.reduce<Record<string, string>>((acc, m) => {
    acc[m.id] = m.name;
    return acc;
  }, {});
});

const stats = computed(() => {
  const s: Record<TaskStatus, number> = {
    pending: 0,
    running: 0,
    success: 0,
    failed: 0,
    cancelled: 0,
  };
  for (const t of tasks.value) s[t.status]++;
  return {
    total: tasks.value.length,
    pending: s.pending,
    running: s.running,
    success: s.success,
    failed: s.failed,
    cancelled: s.cancelled,
  };
});

const STATUS_META: Record<TaskStatus, { label: string; badge: string }> = {
  pending: { label: '排队中', badge: 'bg-slate-100 text-slate-600' },
  running: { label: '运行中', badge: 'bg-sky-100 text-sky-700' },
  success: { label: '成功', badge: 'bg-emerald-100 text-emerald-700' },
  failed: { label: '失败', badge: 'bg-rose-100 text-rose-700' },
  cancelled: { label: '已取消', badge: 'bg-zinc-100 text-zinc-500' },
};

function modelName(t: TaskRecord): string {
  if (t.result?.modelName) return t.result.modelName;
  if (t.modelId) return modelNameMap.value[t.modelId] ?? '未知模型';
  return '默认模型';
}

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

function preview(text: string, len = 80): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) + '…' : flat;
}

function goResumeMatch() {
  router.push('/resume-match');
}

/** 进行中（排队中/运行中）的任务不可查看详情 */
function isInProgress(t: TaskRecord): boolean {
  return t.status === 'pending' || t.status === 'running';
}

function goResumeDetail(id: string) {
  router.push('/resume-detail/' + id);
}

function goReportDetail(id: string) {
  router.push('/report-detail/' + id);
}
</script>

<template>
  <div class="block font-[inherit] min-h-screen bg-slate-50">
    <Header
      title="AI Resume"
      icon="/images/icon.svg"
      :show-prompt="true"
      :show-settings="true"
      :show-plus="true"
      :show-history="true"
      @prompt="() => router.push('/prompt-rules')"
      @settings="() => router.push('/settings')"
      @add="goResumeMatch"
      @history="() => router.push('/history-resumes')"
    />

    <div class="p-4 space-y-4">
      <!-- 任务列表 -->
      <section class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span>共 <b class="text-slate-800">{{ stats.total }}</b></span>
          <span class="text-slate-300">|</span>
          <span>排队 <b class="text-slate-800">{{ stats.pending }}</b></span>
          <span>运行 <b class="text-sky-600">{{ stats.running }}</b></span>
          <span>成功 <b class="text-emerald-600">{{ stats.success }}</b></span>
          <span>失败 <b class="text-rose-600">{{ stats.failed }}</b></span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="stats.total > 0"
            @click="clear('all')"
            class="h-8 px-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg transition-all duration-150 hover:bg-slate-100 active:scale-[0.98]"
          >
            清空
          </button>
          <button
            v-if="stats.total > 0"
            @click="isPaused ? resume() : pause()"
            class="h-8 px-3 text-xs font-medium text-white rounded-lg transition-all duration-150 active:scale-[0.98]"
            :class="isPaused
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-amber-500 hover:bg-amber-600'"
          >
            {{ isPaused ? '继续' : '暂停' }}
          </button>
        </div>
      </section>

      <section v-if="tasks.length" class="space-y-3">
        <article
          v-for="t in tasks"
          :key="t.id"
          class="rounded-xl bg-white border border-slate-200 p-3 flex items-stretch gap-3"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                    :class="STATUS_META[t.status].badge"
                  >
                    <span
                      v-if="t.status === 'running'"
                      class="w-1.5 h-1.5 mr-1 rounded-full bg-sky-500 animate-pulse"
                    ></span>
                    {{ STATUS_META[t.status].label }}
                  </span>
                  <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1">
                    <span v-if="t.result?.summary?.fields?.['姓名']" class="shrink-0">{{ t.result.summary.fields['姓名'] }}</span>
                    <span :class="t.result?.summary?.fields?.['姓名'] ? 'text-xs text-slate-500 font-normal truncate' : 'truncate'">{{ t.ruleName || '未命名规则' }}</span>
                  </h3>
                </div>
                <p class="mt-1 text-xs text-slate-400">
                  {{ modelName(t) }} · {{ formatTime(t.createdAt) }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  :disabled="isInProgress(t)"
                  @click="goResumeDetail(t.id)"
                  class="inline-flex items-center justify-center gap-1 h-7 px-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md transition-colors duration-150 hover:bg-slate-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
                >
                  <IconEye class="w-3.5 h-3.5" />
                  简历
                </button>
                <button
                  :disabled="isInProgress(t)"
                  @click="goReportDetail(t.id)"
                  class="inline-flex items-center justify-center gap-1 h-7 px-2 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md transition-colors duration-150 hover:bg-sky-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sky-50 disabled:active:scale-100"
                >
                  <IconEye class="w-3.5 h-3.5" />
                  报告
                </button>
                <button
                  v-if="t.status === 'pending' || t.status === 'running'"
                  @click="cancel(t.id)"
                  class="shrink-0 h-7 px-2 text-xs text-slate-500 border border-slate-200 rounded-md transition-colors duration-150 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                >
                  取消
                </button>
                <button
                  v-if="!isInProgress(t)"
                  @click="rerun(t)"
                  class="inline-flex items-center justify-center gap-1 h-7 px-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md transition-colors duration-150 hover:bg-slate-100 active:scale-[0.98]"
                >
                  <IconRefresh class="w-3.5 h-3.5" />
                  重跑
                </button>
                <button
                  v-if="t.status !== 'running'"
                  @click="remove(t.id)"
                  class="shrink-0 h-7 px-2 text-xs text-slate-500 border border-slate-200 rounded-md transition-colors duration-150 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                >
                  <IconTrash class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p class="mt-2 text-xs text-slate-600 leading-relaxed break-words">
              {{ preview(t.text) }}
            </p>

            <ReportFieldCard
              v-if="t.status === 'success' && t.result"
              :summary="t.result.summary"
              :output="t.result.output"
              :preview-len="240"
              class="mt-2"
            />

            <p
              v-if="t.status === 'failed' && t.error"
              class="mt-2 text-xs text-rose-600 bg-rose-50/60 border border-rose-100 rounded-lg p-2 break-words"
            >
              {{ t.error }}
            </p>
          </div>
        </article>
      </section>

      <section
        v-else
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <svg class="w-12 h-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
        </svg>
        <p class="text-sm text-slate-400">暂无任务</p>
      </section>
    </div>
  </div>
</template>
