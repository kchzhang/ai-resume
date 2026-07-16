<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from './Header.vue';
import ModelList from './components/ModelList.vue';
import ModelConfigForm from './components/ModelConfigForm.vue';

const router = useRouter();
const route = useRoute();

const subView = computed<'list' | 'add' | 'edit'>(() => {
  if (route.name === 'settings-add') return 'add';
  if (route.name === 'settings-edit') return 'edit';
  return 'list';
});

const editingModelId = computed(() =>
  route.name === 'settings-edit' ? (route.params.id as string) : '',
);

function showAdd() {
  router.push('/settings/add');
}

function showEdit(id: string) {
  router.push(`/settings/edit/${id}`);
}

function back() {
  // 子页（添加/编辑）返回列表，列表页返回主页
  if (subView.value !== 'list') {
    router.push('/settings');
  } else {
    router.push('/');
  }
}
</script>

<template>
  <div class="block font-[inherit]">
    <Header title="模型配置" :show-back="true" @back="back" />
    <div class="p-4">
      <ModelList
        v-if="subView === 'list'"
        @add="showAdd"
        @edit="showEdit"
      />
      <ModelConfigForm
        v-else-if="subView === 'add'"
        @saved="back"
        @cancel="back"
      />
      <ModelConfigForm
        v-else
        :edit-model-id="editingModelId"
        @saved="back"
        @cancel="back"
      />
    </div>
  </div>
</template>
