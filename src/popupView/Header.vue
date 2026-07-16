<script setup lang="ts">
import { IconSettings, IconChevronLeft, IconPrompt, IconPlus, IconHistory } from '@/icons';

defineProps<{
  title: string;
  icon?: string;
  showSettings?: boolean;
  showBack?: boolean;
  showPrompt?: boolean;
  showPlus?: boolean;
  showHistory?: boolean;
}>();

const emit = defineEmits<{
  settings: [];
  back: [];
  prompt: [];
  add: [];
  history: [];
}>();

import { ref, onMounted, onBeforeUnmount } from 'vue';

const scrolled = ref(false);
const onScroll = () => {
  scrolled.value = window.scrollY > 0;
};
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <header class="sticky top-0 z-20 flex items-center justify-between h-11 px-4 border-b border-slate-200 bg-white transition-shadow" :class="scrolled ? 'shadow-sm' : ''">
    <div class="flex items-center gap-2 min-w-0">
      <button
        v-if="showBack"
        @click="emit('back')"
        class="inline-flex items-center justify-center w-7 h-7 -ml-1 rounded-md text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600 shrink-0"
        title="返回"
      >
        <IconChevronLeft class="w-4 h-4" />
      </button>
      <img
        v-if="icon"
        :src="icon"
        alt=""
        class="w-5 h-5 shrink-0 rounded"
      />
      <span class="text-sm font-semibold text-gray-800 truncate">{{ title }}</span>
    </div>
    <div class="flex items-center gap-1">
      <button
        v-if="showPrompt"
        @click="emit('prompt')"
        class="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600 shrink-0"
        title="提示词规则"
      >
        <IconPrompt class="w-4 h-4" />
      </button>
      <button
        v-if="showPlus"
        @click="emit('add')"
        class="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600 shrink-0"
        title="新增简历匹配"
      >
        <IconPlus class="w-4 h-4" />
      </button>
      <button
        v-if="showHistory"
        @click="emit('history')"
        class="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600 shrink-0"
        title="历史简历"
      >
        <IconHistory class="w-4 h-4" />
      </button>
      <button
        v-if="showSettings"
        @click="emit('settings')"
        class="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-colors duration-150 hover:bg-slate-100 hover:text-gray-600 shrink-0"
        title="模型配置"
      >
        <IconSettings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
