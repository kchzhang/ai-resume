import type { TaskInput, TaskRecord } from './task';

/** popup → background 的指令 */
export type RuntimeMessage =
  | { type: 'init' }
  | { type: 'enqueue'; input: TaskInput }
  | { type: 'enqueueBatch'; inputs: TaskInput[] }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'cancel'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'clear'; scope?: 'all' | 'finished' };

/** background → popup 的响应 */
export interface RuntimeResponse {
  ok: boolean;
  error?: string;
  tasks?: TaskRecord[];
  task?: TaskRecord;
  paused?: boolean;
}
