import type { FileType } from './fileReader';

/** 已匹配/已保存的简历记录 */
export interface MatchedResume {
  id: string;
  filename: string;
  fileType: FileType;
  /** 提取出的纯文本 */
  content: string;
  /** 关联的规则 ID */
  ruleId: string;
  /** 关联的规则名称（冗余存储，便于展示） */
  ruleName: string;
  /** 关联的模型 ID */
  modelId: string;
  /** 关联的模型名称（冗余存储，便于展示） */
  modelName: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 文件大小（字节） */
  size: number;
}

export interface ResumeMatchStore {
  resumes: MatchedResume[];
}
