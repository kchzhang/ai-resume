<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { addRule, updateRule, getRuleList } from '@/utils/promptRuleStorage';
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
}

const isEdit = computed(() => !!props.editRuleId);

const form = ref<FormState>({
  name: '',
  rule: '',
});

const saving = ref(false);
const saveSuccess = ref(false);

onMounted(async () => {
  if (props.editRuleId) {
    const rules = await getRuleList();
    const rule = rules.find(r => r.id === props.editRuleId);
    if (rule) {
      form.value = {
        name: rule.name,
        rule: rule.rule,
      };
    }
  }
});

async function handleSave() {
  if (!isFormValid()) return;
  saving.value = true;
  saveSuccess.value = false;
  try {
    const config = {
      name: form.value.name.trim(),
      rule: form.value.rule.trim(),
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

    <!-- 规则内容 -->
    <div class="block">
      <label class="block text-xs font-medium text-gray-500 mb-1.5">规则</label>
      <textarea
        v-model="form.rule"
        rows="10"
        placeholder="请输入提示词规则内容..."
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
