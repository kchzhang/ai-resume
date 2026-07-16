export interface PromptRule {
  id: string;
  name: string;
  rule: string;
}

export interface PromptRuleStore {
  rules: PromptRule[];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
