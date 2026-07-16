import { getStorageData, setStorageData } from '@/utils/storage';
import { generateId } from '@/types/promptRule';
import { type MatchedResume, type ResumeMatchStore } from '@/types/resumeMatch';

const STORAGE_KEY = 'ai_matched_resumes';

function getEmptyStore(): ResumeMatchStore {
  return { resumes: [] };
}

async function getStore(): Promise<ResumeMatchStore> {
  const result = await getStorageData(STORAGE_KEY) as Record<string, any> | null;
  if (!result) return getEmptyStore();
  // chrome.storage.local 返回 { key: data }，localStorage 返回 data 本身
  const data = result[STORAGE_KEY] || result;
  if (data && typeof data === 'object' && 'resumes' in data) {
    return { ...getEmptyStore(), ...data };
  }
  return getEmptyStore();
}

async function saveStore(store: ResumeMatchStore): Promise<void> {
  await setStorageData(STORAGE_KEY, store);
}

/** 获取所有已保存的简历 */
export async function getMatchedResumeList(): Promise<MatchedResume[]> {
  const store = await getStore();
  return store.resumes;
}

/** 按 id 获取单条已保存简历 */
export async function getMatchedResumeById(id: string): Promise<MatchedResume | undefined> {
  const store = await getStore();
  return store.resumes.find((r) => r.id === id);
}

/** 新增一条已保存的简历，返回带 id 的完整记录 */
export async function addMatchedResume(
  config: Omit<MatchedResume, 'id' | 'createdAt'>,
): Promise<MatchedResume> {
  const store = await getStore();
  const record: MatchedResume = { ...config, id: generateId(), createdAt: Date.now() };
  store.resumes.push(record);
  await saveStore(store);
  return record;
}

/** 批量新增已保存的简历 */
export async function addMatchedResumeBatch(
  configs: Omit<MatchedResume, 'id' | 'createdAt'>[],
): Promise<MatchedResume[]> {
  const store = await getStore();
  const records = configs.map((config) => ({
    ...config,
    id: generateId(),
    createdAt: Date.now(),
  }));
  store.resumes.push(...records);
  await saveStore(store);
  return records;
}

/** 删除一条已保存的简历 */
export async function deleteMatchedResume(id: string): Promise<void> {
  const store = await getStore();
  store.resumes = store.resumes.filter((r) => r.id !== id);
  await saveStore(store);
}
