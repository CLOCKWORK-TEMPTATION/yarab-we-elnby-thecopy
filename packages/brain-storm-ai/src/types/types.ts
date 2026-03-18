/**
 * Re-export types from the global types file
 * This allows agents to use relative imports while maintaining a single source of truth
 */

export type {
  AIAgentConfig,
  ProcessedFile,
  CompletionEnhancementOption,
  Script,
  Scene,
  Character,
  DialogueLine,
  SceneActionLine
} from '../../../../types/types';

export {
  TaskType,
  TaskCategory
} from '../../../../types/types';
