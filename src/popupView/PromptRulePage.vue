<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from './Header.vue';
import PromptRuleList from './components/PromptRuleList.vue';
import PromptRuleForm from './components/PromptRuleForm.vue';

const router = useRouter();
const route = useRoute();

const subView = computed<'list' | 'add' | 'edit'>(() => {
  if (route.name === 'prompt-rules-add') return 'add';
  if (route.name === 'prompt-rules-edit') return 'edit';
  return 'list';
});

const editingRuleId = computed(() =>
  route.name === 'prompt-rules-edit' ? (route.params.id as string) : '',
);

function showAdd() {
  router.push('/prompt-rules/add');
}

function showEdit(id: string) {
  router.push(`/prompt-rules/edit/${id}`);
}

function back() {
  // 子页（添加/编辑）返回列表，列表页返回主页
  if (subView.value !== 'list') {
    router.push('/prompt-rules');
  } else {
    router.push('/');
  }
}
</script>

<template>
  <div class="block font-[inherit]">
    <Header title="提示词规则" :show-back="true" @back="back" />
    <div class="p-4">
      <PromptRuleList
        v-if="subView === 'list'"
        @add="showAdd"
        @edit="showEdit"
      />
      <PromptRuleForm
        v-else-if="subView === 'add'"
        @saved="back"
        @cancel="back"
      />
      <PromptRuleForm
        v-else
        :edit-rule-id="editingRuleId"
        @saved="back"
        @cancel="back"
      />
    </div>
  </div>
</template>
