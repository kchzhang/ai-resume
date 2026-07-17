export interface PromptRule {
  id: string;
  name: string;
  rule: string;
  /** 岗位JD（职位描述），作为元数据用于提示词增强生成审核规则 */
  jobDescription?: string;
}

export interface PromptRuleStore {
  rules: PromptRule[];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
