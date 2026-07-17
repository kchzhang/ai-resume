<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getRuleStore, deleteRule } from '@/utils/promptRuleStorage';
import type { PromptRuleStore } from '@/types/promptRule';
import { IconPrompt, IconPlus, IconEdit, IconTrash } from '@/icons';

const emit = defineEmits<{
  add: [];
  edit: [id: string];
}>();

const store = ref<PromptRuleStore>({ rules: [] });
const confirmDeleteId = ref<string | null>(null);

onMounted(async () => {
  store.value = await getRuleStore();
});

async function refresh() {
  store.value = await getRuleStore();
}

async function handleDelete(id: string) {
  await deleteRule(id);
  confirmDeleteId.value = null;
  await refresh();
}

function confirmDelete(id: string) {
  confirmDeleteId.value = id;
}

function cancelDelete() {
  confirmDeleteId.value = null;
}
</script>

<template>
  <div class="block font-[inherit]">
    <!-- 空状态 -->
    <div v-if="store.rules.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
      <IconPrompt class="w-12 h-12 text-slate-300" />
      <p class="mt-3 text-sm text-gray-400">暂无提示词规则</p>
      <button
        @click="emit('add')"
        class="mt-3 inline-flex items-center gap-1 px-4 h-8 text-sm font-medium text-white bg-sky-500 rounded-lg transition-all duration-150 hover:bg-sky-600 active:scale-[0.98]"
      >
        <IconPlus class="w-3.5 h-3.5" />
        添加规则
      </button>
    </div>

    <!-- 规则列表 -->
    <div v-else class="space-y-2">
      <div
        v-for="rule in store.rules"
        :key="rule.id"
        class="relative block p-3 rounded-lg border border-slate-200 bg-white transition-all duration-150 hover:border-slate-300"
      >
        <!-- 规则信息 -->
        <div class="block pr-16">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium text-gray-800 truncate">{{ rule.name }}</span>
            <span v-if="rule.jobDescription" class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-sky-600 bg-sky-50 rounded">JD</span>
          </div>
          <div class="text-xs text-gray-400 line-clamp-2 whitespace-pre-wrap break-words">{{ rule.rule }}</div>
          <div v-if="rule.jobDescription" class="mt-1 text-xs text-gray-300 line-clamp-1 whitespace-pre-wrap break-words">{{ rule.jobDescription }}</div>
        </div>

        <!-- 操作按钮 -->
        <div class="absolute bottom-3 right-3 flex items-center gap-1">
          <!-- 删除确认态 -->
          <template v-if="confirmDeleteId === rule.id">
            <span class="text-[10px] text-red-500 mr-1">确认删除?</span>
            <button
              @click="handleDelete(rule.id)"
              class="inline-flex items-center justify-center w-6 h-6 rounded text-red-500 text-xs hover:bg-red-50 transition-colors"
              title="确认"
            >✓</button>
            <button
              @click="cancelDelete"
              class="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 text-xs hover:bg-slate-100 transition-colors"
              title="取消"
            >✕</button>
          </template>
          <!-- 正常态 -->
          <template v-else>
            <button
              @click="emit('edit', rule.id)"
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600"
              title="编辑"
            >
              <IconEdit class="w-3.5 h-3.5" />
            </button>
            <button
              @click="confirmDelete(rule.id)"
              class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-400"
              title="删除"
            >
              <IconTrash class="w-3.5 h-3.5" />
            </button>
          </template>
        </div>
      </div>

      <!-- 添加按钮 -->
      <button
        @click="emit('add')"
        class="flex items-center justify-center gap-1.5 w-full h-9 text-sm font-medium text-sky-500 bg-sky-50 rounded-lg border border-dashed border-sky-200 transition-all duration-150 hover:bg-sky-100 hover:border-sky-300 active:scale-[0.98]"
      >
        <IconPlus class="w-3.5 h-3.5" />
        添加规则
      </button>
    </div>
  </div>
</template>
