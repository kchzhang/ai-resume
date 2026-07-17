import type { ChatMessage } from '@/types/chat';
import type { PromptRule } from '@/types/promptRule';

/** 评分执行规范，放在规则和JD之后、摘要指令之前 */
const SCORING_INSTRUCTION = `

【评分执行规范】
请严格按照上述评分框架逐项评估候选人简历。每项评估必须：
1. 判断是否命中该评估项的命中条件
2. 根据量化指标确定该项得分
3. 给出命中依据（引用简历中的具体内容）
各项得分累加即为总分，总分必须等于各项得分之和。`;

/** 追加到 system prompt 末尾的摘要指令 */
const SUMMARY_INSTRUCTION = `

【输出格式要求】
请在报告正文最前面用如下 HTML 注释包裹 JSON 格式的核心摘要字段（渲染时不会显示该注释）：
<!--SUMMARY_START-->
{"fields":{"字段名1":"值1","字段名2":"值2"}}
<!--SUMMARY_END-->
字段名和值必须严格为以下6项：姓名、年龄、专业、学历、总分、最终建议。不要添加其他字段。
其中"总分"必须为评分框架各项得分之累加总和，不得为主观估算值。`;

/** 将用户输入与规则组合成对话消息：规则作为 system，用户输入作为 user */
export function buildMessages(text: string, rule: PromptRule): ChatMessage[] {
  let systemContent = rule.rule;
  if (rule.jobDescription) {
    systemContent += `\n\n【岗位JD原始文本】\n以下是本评分框架对应的岗位JD原始文本，作为评估的溯源依据：\n${rule.jobDescription}`;
  }
  systemContent += SCORING_INSTRUCTION + SUMMARY_INSTRUCTION;
  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: text },
  ];
}

/** 生成可读的提示词预览（用于 UI 展示） */
export function buildPromptPreview(text: string, rule: PromptRule): string {
  let preview = `【系统指令】\n${rule.rule}`;
  if (rule.jobDescription) {
    preview += `\n\n【岗位JD原始文本】\n${rule.jobDescription}`;
  }
  preview += `\n\n【用户输入】\n${text}`;
  return preview;
}
