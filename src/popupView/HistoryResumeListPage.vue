<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from './Header.vue';
import { IconEye, IconTrash } from '@/icons';
import { getMatchedResumeList, deleteMatchedResume } from '@/utils/resumeMatchStorage';
import type { MatchedResume } from '@/types/resumeMatch';

const router = useRouter();
const resumes = ref<MatchedResume[]>([]);
const loading = ref(true);

onMounted(async () => {
  resumes.value = await getMatchedResumeList();
  loading.value = false;
});

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function preview(text: string, len = 120): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) + '…' : flat;
}

function goDetail(id: string) {
  router.push('/history-resume-detail/' + id);
}

async function remove(id: string, event: Event) {
  event.stopPropagation();
  if (!window.confirm('确定删除这条历史简历吗？')) return;
  await deleteMatchedResume(id);
  resumes.value = resumes.value.filter((r) => r.id !== id);
}
</script>

<template>
  <div class="block font-[inherit] min-h-screen bg-slate-50">
    <Header title="历史简历" :show-back="true" @back="() => router.back()" />

    <div class="p-4 space-y-4">
      <p v-if="!loading && resumes.length" class="text-xs text-slate-400">
        共 {{ resumes.length }} 份已保存的简历
      </p>

      <!-- 加载态 -->
      <section v-if="loading" class="flex items-center justify-center py-16">
        <span class="text-sm text-slate-400">加载中…</span>
      </section>

      <!-- 列表 -->
      <section v-else-if="resumes.length" class="space-y-3">
        <article
          v-for="r in resumes"
          :key="r.id"
          @click="goDetail(r.id)"
          class="rounded-xl bg-white border border-slate-200 p-3 flex items-stretch gap-3 cursor-pointer transition-colors duration-150 hover:border-sky-300 hover:bg-sky-50/30"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium uppercase bg-slate-100 text-slate-600"
                  >
                    {{ r.fileType }}
                  </span>
                  <h3 class="text-sm font-semibold text-slate-800 truncate">{{ r.filename }}</h3>
                </div>
                <p class="mt-1 text-xs text-slate-400">
                  {{ r.ruleName }} · {{ r.modelName }} · {{ formatTime(r.createdAt) }} · {{ formatSize(r.size) }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  @click="goDetail(r.id)"
                  class="inline-flex items-center justify-center gap-1 h-7 px-2 text-xs font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md transition-colors duration-150 hover:bg-sky-100 active:scale-[0.98]"
                >
                  <IconEye class="w-3.5 h-3.5" />
                  查看
                </button>
                <button
                  @click="remove(r.id, $event)"
                  class="shrink-0 h-7 px-2 text-xs text-slate-500 border border-slate-200 rounded-md transition-colors duration-150 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                >
                  <IconTrash class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p class="mt-2 text-xs text-slate-600 leading-relaxed break-words">
              {{ preview(r.content) }}
            </p>
          </div>
        </article>
      </section>

      <!-- 空态 -->
      <section
        v-else
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <svg class="w-12 h-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3v5h5" />
          <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
          <path d="M12 7v5l4 2" />
        </svg>
        <p class="text-sm text-slate-400">暂无历史简历</p>
      </section>
    </div>
  </div>
</template>
