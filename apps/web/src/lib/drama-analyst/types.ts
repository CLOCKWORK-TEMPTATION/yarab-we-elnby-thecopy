/**
 * Core types for Drama Analyst AI Agent System
 */

// Re-export core types from central types file
export type {
  AIAgentConfig,
  AIAgentCapabilities,
  StandardAgentOptions,
  StandardAgentInput,
  StandardAgentOutput,
  Result,
  AIRequest,
  AIResponse,
  AgentConfigMapping,
} from "../../core/types";

export { TaskType, TaskCategory } from "../../core/types";

/**
 * Processed file information
 */
export interface ProcessedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  processedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Agent identifier type
 */
export type AgentId = string;
