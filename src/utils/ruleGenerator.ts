import { ChatClient } from './chatClient';
import type { ChatMessage } from '@/types/chat';

const RULE_GEN_SYSTEM_PROMPT = `你是一个专业的岗位JD评分框架设计专家。

任务：根据用户提供的岗位JD（职位描述），将其深度拆解为一套结构化的简历评分框架。

评分框架设计原则：
1. **维度拆解**：从JD中提取所有关键要求，按逻辑归类为评估维度（如：专业技能、工作经验、学历背景、行业领域、软技能等）
2. **评估项细化**：每个维度下拆解为具体的评估项，每个评估项对应JD中的一条或多条要求
3. **命中条件明确**：每项评估必须定义清晰的"命中条件"——即简历中出现什么具体内容才算满足该要求（如："简历中明确提及Python开发经验"）
4. **量化指标可追溯**：分值必须基于可量化的指标得出（如年限、项目数量、证书等级），不得使用模糊的"较好/一般"等主观描述
5. **满分总和严格等于100分**：所有评估项的满分之和必须恰好为100分，不得超出或不足

输出格式（必须严格遵循）：

## 评估维度：{维度名称}（满分 {维度总分}分）

### 评估项 1：{评估项名称}（满分 {分值}分）
- **JD原文要求**：{JD中对应的要求原文}
- **命中条件**：{简历中出现什么具体内容才算命中}
- **量化指标与评分规则**：
  - {指标等级1}：{得分}分
  - {指标等级2}：{得分}分
  - ...

### 评估项 2：...
...

## 评估维度：{下一个维度名称}（满分 {维度总分}分）
...

确保：
- 每个评估项的评分规则都有明确的梯度（如：完全满足=满分，部分满足=相应分值，未满足=0分）
- 所有评估项满分之和 = 100分
- 不添加额外的前言或结语`;

/**
 * 根据岗位JD调用AI流式生成审核规则
 * @param jobDescription 岗位JD文本
 * @param onChunk 流式回调，每次收到新 chunk 时调用
 * @returns 生成的完整规则文本
 */
export async function generateRuleFromJD(
  jobDescription: string,
  onChunk?: (content: string) => void,
): Promise<string> {
  const client = await ChatClient.fromActiveModel();

  const messages: ChatMessage[] = [
    { role: 'system', content: RULE_GEN_SYSTEM_PROMPT },
    { role: 'user', content: jobDescription },
  ];

  let result = '';
  for await (const chunk of client.chatStream(messages)) {
    if (chunk.cancelled) break;
    if (chunk.content) {
      result += chunk.content;
      onChunk?.(chunk.content);
    }
    if (chunk.done && !chunk.cancelled) break;
  }
  return result;
}
