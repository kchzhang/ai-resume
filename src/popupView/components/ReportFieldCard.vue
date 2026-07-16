<script setup lang="ts">
import { computed } from 'vue';
import type { TaskSummary } from '@/types/task';

/** 固定字段显示顺序：仅展示核心字段，按优先级排列 */
const FIELD_ORDER = ['姓名', '年龄', '专业', '学历', '总分', '最终建议'];

const props = withDefaults(defineProps<{
  summary?: TaskSummary;
  output: string;
  previewLen?: number;
}>(), {
  previewLen: 240,
});

function preview(text: string, len: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) + '…' : flat;
}

const hasFields = computed(() => props.summary?.fields && Object.keys(props.summary.fields).length > 0);

/** 将 fields 按固定顺序排列成数组 */
const fieldEntries = computed(() => {
  if (!props.summary?.fields) return [];
  const entries = Object.entries(props.summary.fields);

  // 按优先级排序：在 FIELD_ORDER 中的按索引排，不在的追加到末尾
  const sorted = entries.sort(([a], [b]) => {
    const ai = FIELD_ORDER.indexOf(a);
    const bi = FIELD_ORDER.indexOf(b);
    // 都在列表中 → 按索引排；都不在 → 保持原顺序；一个在 → 在列表中的优先
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });

  return sorted;
});
</script>

<template>
  <!-- 摘要字段横排展示 -->
  <div
    v-if="hasFields"
    class="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2 text-xs text-slate-700 leading-relaxed"
  >
    <template v-for="([key, value], idx) in fieldEntries" :key="key">
      <span class="text-slate-500">{{ key }}</span>:&nbsp;&nbsp;<span class="font-medium">{{ value }}</span>
      <span v-if="idx < fieldEntries.length - 1" class="text-slate-300 mx-1.5">|</span>
    </template>
  </div>
  <!-- 无摘要时降级为纯文本 -->
  <p
    v-else
    class="text-xs text-slate-700 bg-emerald-50/60 border border-emerald-100 rounded-lg p-2 leading-relaxed break-words whitespace-pre-wrap"
  >
    {{ preview(output, previewLen) }}
  </p>
</template>
