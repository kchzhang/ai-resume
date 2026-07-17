<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { addRule, updateRule, getRuleList } from '@/utils/promptRuleStorage';
import { generateRuleFromJD } from '@/utils/ruleGenerator';
import { IconCheck } from '@/icons';

const props = defineProps<{
  editRuleId?: string;
}>();

const emit = defineEmits<{
  saved: [];
  cancel: [];
}>();

interface FormState {
  name: string;
  rule: string;
  jobDescription: string;
}

const isEdit = computed(() => !!props.editRuleId);

const form = ref<FormState>({
  name: '',
  rule: '',
  jobDescription: '',
});

const saving = ref(false);
const saveSuccess = ref(false);
const generating = ref(false);
const genError = ref('');

onMounted(async () => {
  if (props.editRuleId) {
    const rules = await getRuleList();
    const rule = rules.find(r => r.id === props.editRuleId);
    if (rule) {
      form.value = {
        name: rule.name,
        rule: rule.rule,
        jobDescription: rule.jobDescription ?? '',
      };
    }
  }
});

async function handleGenerate() {
  const jd = form.value.jobDescription.trim();
  if (!jd) return;
  generating.value = true;
  genError.value = '';
  form.value.rule = '';
  try {
    await generateRuleFromJD(jd, (chunk) => {
      form.value.rule += chunk;
    });
  } catch (err) {
    genError.value = err instanceof Error ? err.message : '生成失败';
  } finally {
    generating.value = false;
  }
}

async function handleSave() {
  if (!isFormValid()) return;
  saving.value = true;
  saveSuccess.value = false;
  try {
    const config = {
      name: form.value.name.trim(),
      rule: form.value.rule.trim(),
      jobDescription: form.value.jobDescription.trim() || undefined,
    };
    if (isEdit.value && props.editRuleId) {
      await updateRule(props.editRuleId, config);
    } else {
      await addRule(config);
    }
    saveSuccess.value = true;
    emit('saved');
  } finally {
    saving.value = false;
  }
}

const isFormValid = () =>
  form.value.name.trim() !== '' &&
  form.value.rule.trim() !== '';
</script>

<template>
  <div class="block font-[inherit] space-y-4">
    <!-- 规则名称 -->
    <div class="block">
      <label class="block text-xs font-medium text-gray-500 mb-1.5">名称</label>
      <input
        v-model="form.name"
        type="text"
        placeholder="如：简历语气要求"
        class="block w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg text-gray-700 outline-none transition-colors duration-150 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 placeholder:text-gray-300"
      />
    </div>

    <!-- 岗位JD -->
    <div class="block">
      <label class="block text-xs font-medium text-gray-500 mb-1.5">岗位JD</label>
      <textarea
        v-model="form.jobDescription"
        rows="4"
        placeholder="粘贴岗位JD（职位描述），AI将据此自动生成审核规则..."
        class="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-gray-700 outline-none transition-colors duration-150 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 placeholder:text-gray-300 resize-y leading-relaxed"
      ></textarea>
      <button
        @click="handleGenerate"
        :disabled="generating || !form.jobDescription.trim()"
        class="mt-2 inline-flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium text-sky-600 bg-sky-50 rounded-lg border border-sky-200 transition-all duration-150 hover:bg-sky-100 hover:border-sky-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span v-if="generating">生成中...</span>
        <span v-else>AI 生成规则</span>
      </button>
      <p v-if="genError" class="mt-1 text-xs text-red-400">{{ genError }}</p>
    </div>

    <!-- 规则内容 -->
    <div class="block">
      <label class="block text-xs font-medium text-gray-500 mb-1.5">规则</label>
      <textarea
        v-model="form.rule"
        rows="10"
        placeholder="请输入提示词规则内容，或通过岗位JD自动生成..."
        class="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-gray-700 outline-none transition-colors duration-150 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 placeholder:text-gray-300 resize-y leading-relaxed"
      ></textarea>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center gap-2 pt-2">
      <button
        @click="emit('cancel')"
        class="flex-1 h-9 text-sm font-medium text-gray-500 bg-white border border-slate-200 rounded-lg transition-all duration-150 hover:bg-slate-50 active:scale-[0.98]"
      >
        取消
      </button>
      <button
        @click="handleSave"
        :disabled="saving || !isFormValid()"
        class="flex-1 h-9 text-sm font-medium text-white bg-sky-500 rounded-lg transition-all duration-150 hover:bg-sky-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sky-500"
      >
        <span v-if="saving">保存中...</span>
        <span v-else-if="saveSuccess" class="inline-flex items-center justify-center gap-1">
          <IconCheck class="w-3.5 h-3.5" />
          已保存
        </span>
        <span v-else>{{ isEdit ? '保存修改' : '添加规则' }}</span>
      </button>
    </div>
  </div>
</template>
