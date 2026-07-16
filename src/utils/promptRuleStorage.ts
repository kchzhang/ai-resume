import { getStorageData, setStorageData } from '@/utils/storage';
import { generateId, type PromptRule, type PromptRuleStore } from '@/types/promptRule';

const STORAGE_KEY = 'ai_prompt_rules';

function getEmptyStore(): PromptRuleStore {
  return { rules: [] };
}

async function getStore(): Promise<PromptRuleStore> {
  const result = await getStorageData(STORAGE_KEY) as Record<string, any> | null;
  if (!result) return getEmptyStore();
  // chrome.storage.local 返回 { key: data }，localStorage 返回 data 本身
  const data = result[STORAGE_KEY] || result;
  if (data && typeof data === 'object' && 'rules' in data) {
    return { ...getEmptyStore(), ...data };
  }
  return getEmptyStore();
}

async function saveStore(store: PromptRuleStore): Promise<void> {
  await setStorageData(STORAGE_KEY, store);
}

/** 获取所有规则 */
export async function getRuleList(): Promise<PromptRule[]> {
  const store = await getStore();
  return store.rules;
}

/** 新增规则 */
export async function addRule(config: Omit<PromptRule, 'id'>): Promise<PromptRule> {
  const store = await getStore();
  const newRule: PromptRule = { ...config, id: generateId() };
  store.rules.push(newRule);
  await saveStore(store);
  return newRule;
}

/** 更新规则 */
export async function updateRule(id: string, config: Omit<PromptRule, 'id'>): Promise<void> {
  const store = await getStore();
  const index = store.rules.findIndex(r => r.id === id);
  if (index === -1) throw new Error('规则不存在');
  store.rules[index] = { ...config, id };
  await saveStore(store);
}

/** 删除规则 */
export async function deleteRule(id: string): Promise<void> {
  const store = await getStore();
  store.rules = store.rules.filter(r => r.id !== id);
  await saveStore(store);
}

/** 获取完整 Store（供列表页使用） */
export async function getRuleStore(): Promise<PromptRuleStore> {
  return getStore();
}
