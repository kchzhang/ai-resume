<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from './Header.vue';
import { fileReadManager, FileType } from '@/utils/fileReader';
import { getRuleList } from '@/utils/promptRuleStorage';
import type { PromptRule } from '@/types/promptRule';
import { getModelList, getActiveModelId } from '@/utils/modelStorage';
import type { ModelConfig } from '@/types/model';
import { addMatchedResumeBatch } from '@/utils/resumeMatchStorage';
import type { MatchedResume } from '@/types/resumeMatch';
import type { FileReadResult } from '@/types/fileReader';
import { useTaskQueue } from '@/composables/useTaskQueue';

const router = useRouter();
const { enqueueBatch } = useTaskQueue();

interface UploadItem {
  file: File;
  filename: string;
  fileType: FileType | '';
  size: number;
  status: 'pending' | 'reading' | 'done' | 'error';
  error?: string;
}

const rules = ref<PromptRule[]>([]);
const models = ref<ModelConfig[]>([]);
const selectedRuleId = ref('');
const selectedModelId = ref('');

const uploadItems = ref<UploadItem[]>([]);
const isSaving = ref(false);
const toast = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

const ACCEPT = '.pdf,.docx,.txt,.md';

onMounted(async () => {
  [rules.value, models.value] = await Promise.all([getRuleList(), getModelList()]);
  selectedRuleId.value = rules.value[0]?.id ?? '';
  selectedModelId.value = await getActiveModelId();
});

function showToast(type: 'success' | 'error' | 'info', text: string) {
  toast.value = { type, text };
  window.setTimeout(() => {
    if (toast.value?.text === text) toast.value = null;
  }, 2600);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function pickFiles() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = ACCEPT;
  input.onchange = () => {
    const files = Array.from(input.files ?? []);
    addFiles(files);
  };
  input.click();
}

function addFiles(files: File[]) {
  for (const file of files) {
    const ext = /\.[^.\\/]+$/.exec(file.name)?.[0]?.toLowerCase() ?? '';
    const supported = ['.pdf', '.docx', '.txt', '.md'].includes(ext);
    uploadItems.value.push({
      file,
      filename: file.name,
      fileType: supported ? (ext.slice(1) as FileType) : '',
      size: file.size,
      status: supported ? 'pending' : 'error',
      error: supported ? undefined : '不支持的文件类型',
    });
  }
}

function removeItem(index: number) {
  uploadItems.value.splice(index, 1);
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const files = Array.from(event.dataTransfer?.files ?? []);
  if (files.length) addFiles(files);
}

function cancel() {
  router.back();
}

async function save() {
  if (isSaving.value) return;
  const validItems = uploadItems.value.filter((i) => i.status !== 'error');
  if (validItems.length === 0) {
    showToast('error', '请先上传至少一个支持的文件');
    return;
  }
  if (!selectedRuleId.value) {
    showToast('error', '请先选择一条规则（可在提示词规则中配置）');
    return;
  }
  if (!selectedModelId.value) {
    showToast('error', '请先选择一个模型（可在模型配置中配置）');
    return;
  }

  const rule = rules.value.find((r) => r.id === selectedRuleId.value);
  const model = models.value.find((m) => m.id === selectedModelId.value);
  if (!rule || !model) {
    showToast('error', '规则或模型不存在，请重新选择');
    return;
  }

  isSaving.value = true;
  const configs: Omit<MatchedResume, 'id' | 'createdAt'>[] = [];
  let hasError = false;

  for (const item of validItems) {
    item.status = 'reading';
    try {
      const result: FileReadResult = await fileReadManager.read(item.file, {
        extractMetadata: true,
      });
      configs.push({
        filename: result.filename,
        fileType: result.fileType,
        content: result.content,
        ruleId: rule.id,
        ruleName: rule.name,
        modelId: model.id,
        modelName: model.name,
        size: item.size,
      });
      item.status = 'done';
    } catch (err) {
      item.status = 'error';
      item.error = err instanceof Error ? err.message : '提取文本失败';
      hasError = true;
    }
  }

  if (configs.length > 0) {
    await addMatchedResumeBatch(configs);
    // 批量入队，交给任务队列执行（尊重所选模型）；await 确保消息已下发再跳转
    await enqueueBatch(
      configs.map((c) => ({
        text: c.content,
        ruleId: c.ruleId,
        modelId: c.modelId,
      })),
    );
  }
  isSaving.value = false;

  if (hasError && configs.length === 0) {
    showToast('error', '所有文件提取失败，请检查文件后重试');
    return;
  }

  showToast(
    'success',
    hasError
      ? `已保存 ${configs.length} 个文件，部分文件提取失败`
      : `已成功保存 ${configs.length} 个简历`,
  );
  window.setTimeout(() => router.back(), 900);
}
</script>

<template>
  <div class="block font-[inherit] min-h-screen bg-slate-50">
    <Header title="简历匹配" :show-back="true" @back="cancel" />

    <!-- 提示条 -->
    <transition name="fade">
      <div
        v-if="toast"
        class="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-xs font-medium shadow-lg"
        :class="{
          'bg-emerald-600 text-white': toast.type === 'success',
          'bg-rose-600 text-white': toast.type === 'error',
          'bg-slate-800 text-white': toast.type === 'info',
        }"
      >
        {{ toast.text }}
      </div>
    </transition>

    <div class="p-4 space-y-4 pb-24">
      <!-- 上传区 -->
      <section>
        <h2 class="text-xs font-semibold text-slate-500 mb-2">简历文件（支持 PDF / Word / TXT / MD，可批量）</h2>
        <div
          class="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-white cursor-pointer transition-colors duration-150 hover:border-sky-400 hover:bg-sky-50/40"
          @click="pickFiles"
          @dragover.prevent
          @drop="onDrop"
        >
          <svg class="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p class="text-xs text-slate-500">点击或拖拽文件到此处上传</p>
        </div>

        <!-- 文件列表 -->
        <ul v-if="uploadItems.length" class="mt-3 space-y-2">
          <li
            v-for="(item, index) in uploadItems"
            :key="index"
            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-slate-200"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm text-slate-800 truncate">{{ item.filename }}</p>
              <p class="text-xs text-slate-400">
                {{ formatSize(item.size) }}
                <span v-if="item.fileType" class="ml-1 uppercase">· {{ item.fileType }}</span>
                <span v-if="item.status === 'reading'" class="ml-1 text-sky-500">· 提取中…</span>
                <span v-else-if="item.status === 'done'" class="ml-1 text-emerald-500">· 已提取</span>
                <span v-else-if="item.status === 'error'" class="ml-1 text-rose-500">· {{ item.error }}</span>
              </p>
            </div>
            <button
              @click="removeItem(index)"
              class="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-500"
              title="移除"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </li>
        </ul>
      </section>

      <!-- 规则选择 -->
      <section>
        <label class="block text-xs font-semibold text-slate-500 mb-2">匹配规则</label>
        <select
          v-model="selectedRuleId"
          class="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-sky-400"
        >
          <option v-if="rules.length === 0" value="" disabled>尚未配置规则，请先到「提示词规则」添加</option>
          <option v-for="rule in rules" :key="rule.id" :value="rule.id">{{ rule.name }}</option>
        </select>
        <p v-if="rules.length === 0" class="mt-1 text-xs text-amber-500">未找到任何规则，请先配置。</p>
      </section>

      <!-- 模型选择 -->
      <section>
        <label class="block text-xs font-semibold text-slate-500 mb-2">模型</label>
        <select
          v-model="selectedModelId"
          class="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-sky-400"
        >
          <option v-if="models.length === 0" value="" disabled>尚未配置模型，请先到「模型配置」添加</option>
          <option v-for="model in models" :key="model.id" :value="model.id">{{ model.name }}</option>
        </select>
        <p v-if="models.length === 0" class="mt-1 text-xs text-amber-500">未找到任何模型，请先配置。</p>
      </section>
    </div>

    <!-- 右下角操作按钮 -->
    <div class="fixed bottom-0 left-0 right-0 flex justify-end gap-2 p-4 bg-white border-t border-slate-200">
      <button
        @click="cancel"
        class="h-10 px-5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg transition-all duration-150 hover:bg-slate-200 active:scale-[0.98]"
      >
        取消
      </button>
      <button
        @click="save"
        :disabled="isSaving"
        class="h-10 px-5 text-sm font-medium text-white bg-sky-500 rounded-lg transition-all duration-150 hover:bg-sky-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ isSaving ? '保存中…' : '保存' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
