import { GeminiService } from './geminiService';
import type { AgentConfig } from '../../config/agents';
import { agentsConfig } from '../../config/agents';
import { TaskCategory, TaskType } from '../../types/types';
import type { AIAgentConfig } from '../../types/types';

export class IntegratedAgent {
  protected geminiService: GeminiService;
  protected config: AgentConfig;
  protected agentConfig: AIAgentConfig;

  constructor(agentConfig: AIAgentConfig, apiKey: string) {
    this.agentConfig = agentConfig;
    this.config = agentsConfig[agentConfig.id || 'default'] || agentsConfig.default;
    this.geminiService = new GeminiService(apiKey, this.config);
  }

  public async execute(...args: any[]): Promise<any> {
    // This is a base method that should be overridden by subclasses
    throw new Error("Method 'execute()' must be implemented.");
  }
}

