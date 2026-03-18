/**
 * Multi-Agent Orchestrator - Backend
 * Orchestrates multiple agents to work together on complex analysis tasks
 * Includes multi-agent debate system (المرحلة 3)
 * Enhanced with workflow system support
 */

import { TaskType } from './core/enums';
import { StandardAgentInput, StandardAgentOutput } from './core/types';
import { agentRegistry } from './registry';
import { logger } from '@/utils/logger';
import { startDebate } from './debate';
import { DebateConfig } from './debate/types';
import { BaseAgent } from './shared/BaseAgent';
import { workflowExecutor } from './core/workflow-executor';
import { WorkflowConfig, WorkflowStatus } from './core/workflow-types';
import { getPresetWorkflow, PresetWorkflowName } from './core/workflow-presets';

export interface OrchestrationInput {
  fullText: string;
  projectName: string;
  taskTypes: TaskType[];
  context?: Record<string, any>;
  options?: {
    parallel?: boolean;
    timeout?: number;
    includeMetadata?: boolean;
  };
}

export interface OrchestrationOutput {
  results: Map<TaskType, StandardAgentOutput>;
  summary: {
    totalExecutionTime: number;
    successfulTasks: number;
    failedTasks: number;
    averageConfidence: number;
  };
  metadata?: {
    startedAt: string;
    finishedAt: string;
    tasksExecuted: TaskType[];
  };
}

export class MultiAgentOrchestrator {
  private static instance: MultiAgentOrchestrator;

  private constructor() {}

  public static getInstance(): MultiAgentOrchestrator {
    if (!MultiAgentOrchestrator.instance) {
      MultiAgentOrchestrator.instance = new MultiAgentOrchestrator();
    }
    return MultiAgentOrchestrator.instance;
  }

  /**
   * Execute multiple agents in sequence or parallel
   */
  async executeAgents(input: OrchestrationInput): Promise<OrchestrationOutput> {
    const startTime = Date.now();
    const results = new Map<TaskType, StandardAgentOutput>();
    const { fullText, taskTypes, context, options } = input;

    logger.info(`Starting multi-agent orchestration for ${taskTypes.length} tasks`);

    try {
      if (options?.parallel) {
        // Execute agents in parallel
        await this.executeInParallel(fullText, taskTypes, context, results);
      } else {
        // Execute agents sequentially
        await this.executeSequentially(fullText, taskTypes, context, results);
      }

      // Calculate summary statistics
      const endTime = Date.now();
      const successfulTasks = Array.from(results.values()).filter(
        (r) => r.confidence > 0.5
      ).length;
      const failedTasks = taskTypes.length - successfulTasks;
      const averageConfidence =
        Array.from(results.values()).reduce((sum, r) => sum + r.confidence, 0) /
        Math.max(results.size, 1);

      const orchestrationOutput: OrchestrationOutput = {
        results,
        summary: {
          totalExecutionTime: endTime - startTime,
          successfulTasks,
          failedTasks,
          averageConfidence,
        },
      };

      if (options?.includeMetadata) {
        orchestrationOutput.metadata = {
          startedAt: new Date(startTime).toISOString(),
          finishedAt: new Date(endTime).toISOString(),
          tasksExecuted: taskTypes,
        };
      }

      logger.info(
        `Multi-agent orchestration completed: ${successfulTasks}/${taskTypes.length} successful`
      );

      return orchestrationOutput;
    } catch (error) {
      logger.error('Multi-agent orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Execute agents in parallel
   */
  private async executeInParallel(
    fullText: string,
    taskTypes: TaskType[],
    context: Record<string, any> | undefined,
    results: Map<TaskType, StandardAgentOutput>
  ): Promise<void> {
    const promises = taskTypes.map(async (taskType) => {
      const agent = agentRegistry.getAgent(taskType);
      if (!agent) {
        logger.warn(`Agent not found for task type: ${taskType}`);
        return;
      }

      try {
        const agentInput: StandardAgentInput = {
          input: fullText,
          context: context || {},
          options: {
            enableRAG: true,
            enableSelfCritique: true,
            enableConstitutional: true,
            enableUncertainty: true,
            enableHallucination: true,
          },
        };

        const output = await agent.executeTask(agentInput);
        results.set(taskType, output);
      } catch (error) {
        logger.error(`Agent execution failed for ${taskType}:`, error);
        // Store error result
        results.set(taskType, {
          text: 'فشل في تنفيذ التحليل',
          confidence: 0,
          notes: [`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequentially(
    fullText: string,
    taskTypes: TaskType[],
    context: Record<string, any> | undefined,
    results: Map<TaskType, StandardAgentOutput>
  ): Promise<void> {
    for (const taskType of taskTypes) {
      const agent = agentRegistry.getAgent(taskType);
      if (!agent) {
        logger.warn(`Agent not found for task type: ${taskType}`);
        continue;
      }

      try {
        const agentInput: StandardAgentInput = {
          input: fullText,
          context: {
            ...(context || {}),
            previousResults: Object.fromEntries(results),
          },
          options: {
            enableRAG: true,
            enableSelfCritique: true,
            enableConstitutional: true,
            enableUncertainty: true,
            enableHallucination: true,
          },
        };

        const output = await agent.executeTask(agentInput);
        results.set(taskType, output);

        logger.info(
          `Agent ${taskType} completed with confidence: ${output.confidence}`
        );
      } catch (error) {
        logger.error(`Agent execution failed for ${taskType}:`, error);
        // Store error result
        results.set(taskType, {
          text: 'فشل في تنفيذ التحليل',
          confidence: 0,
          notes: [`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
        });
      }
    }
  }

  /**
   * Execute a single agent
   */
  async executeSingleAgent(
    taskType: TaskType,
    input: string,
    context?: Record<string, any>
  ): Promise<StandardAgentOutput> {
    const agent = agentRegistry.getAgent(taskType);
    if (!agent) {
      throw new Error(`Agent not found for task type: ${taskType}`);
    }

    const agentInput: StandardAgentInput = {
      input,
      context: context || {},
      options: {
        enableRAG: true,
        enableSelfCritique: true,
        enableConstitutional: true,
        enableUncertainty: true,
        enableHallucination: true,
      },
    };

    return await agent.executeTask(agentInput);
  }

  /**
   * Get recommended agents for a given project type
   */
  getRecommendedAgents(projectType: 'film' | 'series' | 'stage'): TaskType[] {
    const commonAgents = [
      TaskType.CHARACTER_DEEP_ANALYZER,
      TaskType.DIALOGUE_ADVANCED_ANALYZER,
      TaskType.THEMES_MESSAGES_ANALYZER,
    ];

    switch (projectType) {
      case 'film':
        return [
          ...commonAgents,
          TaskType.VISUAL_CINEMATIC_ANALYZER,
          TaskType.PRODUCIBILITY_ANALYZER,
          TaskType.TARGET_AUDIENCE_ANALYZER,
        ];
      case 'series':
        return [
          ...commonAgents,
          TaskType.CULTURAL_HISTORICAL_ANALYZER,
          TaskType.TARGET_AUDIENCE_ANALYZER,
        ];
      case 'stage':
        return [
          ...commonAgents,
          TaskType.CULTURAL_HISTORICAL_ANALYZER,
        ];
      default:
        return commonAgents;
    }
  }

  /**
   * Run a multi-agent debate on a topic
   * المرحلة 3 - Multi-Agent Debate System
   *
   * @param topic - The topic to debate
   * @param taskTypes - Task types of agents to include in debate (optional)
   * @param context - Additional context for the debate
   * @param config - Debate configuration
   * @param confidenceThreshold - Minimum confidence to trigger debate (default: 0.6)
   */
  async debateAgents(
    topic: string,
    taskTypes?: TaskType[],
    context?: string,
    config?: Partial<DebateConfig>,
    confidenceThreshold: number = 0.6
  ): Promise<StandardAgentOutput> {
    logger.info(`Starting multi-agent debate on: ${topic}`);

    try {
      // Get available agents
      let availableAgents: BaseAgent[];

      if (taskTypes && taskTypes.length > 0) {
        // Use specified task types
        availableAgents = taskTypes
          .map(taskType => agentRegistry.getAgent(taskType))
          .filter((agent): agent is BaseAgent => agent !== undefined);
      } else {
        // Use all available agents
        const allAgents = agentRegistry.getAllAgents();
        availableAgents = Array.from(allAgents.values());
      }

      if (availableAgents.length === 0) {
        throw new Error('لا توجد وكلاء متاحة للمناظرة');
      }

      logger.info(`Selected ${availableAgents.length} agents for debate`);

      // Merge config with defaults
      const debateConfig: Partial<DebateConfig> = {
        confidenceThreshold,
        ...config,
      };

      // Start debate
      const result = await startDebate(
        topic,
        availableAgents,
        context,
        debateConfig
      );

      logger.info(
        `Multi-agent debate completed with confidence: ${result.confidence}`
      );

      return result;
    } catch (error) {
      logger.error('Multi-agent debate failed:', error);

      // Return fallback result
      return {
        text: `فشلت المناظرة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        confidence: 0.3,
        notes: ['فشل في إتمام المناظرة'],
        metadata: {
          debateRounds: 0,
        },
      };
    }
  }

  /**
   * Execute agents with optional debate
   * If confidence is below threshold, trigger a debate
   *
   * @param input - Orchestration input
   * @param enableDebate - Whether to enable debate for low-confidence results
   * @param debateConfig - Configuration for debate
   */
  async executeWithDebate(
    input: OrchestrationInput,
    enableDebate: boolean = true,
    debateConfig?: Partial<DebateConfig>
  ): Promise<OrchestrationOutput> {
    // First, execute normally
    const result = await this.executeAgents(input);

    // Check if debate is needed
    if (enableDebate && result.summary.averageConfidence < 0.7) {
      logger.info(
        `Low average confidence (${result.summary.averageConfidence.toFixed(2)}), triggering debate`
      );

      try {
        // Get agents that participated
        const participatingTaskTypes = Array.from(result.results.keys());
        const agents = participatingTaskTypes
          .map(taskType => agentRegistry.getAgent(taskType))
          .filter((agent): agent is BaseAgent => agent !== undefined);

        // Run debate to improve results
        const debateTopic = `تحسين تحليل المشروع: ${input.projectName}`;
        const debateResult = await startDebate(
          debateTopic,
          agents,
          input.fullText,
          debateConfig
        );

        // Add debate result to results
        result.results.set(TaskType.INTEGRATED, debateResult);

        // Update summary
        result.summary.successfulTasks += 1;
        const allConfidences = Array.from(result.results.values()).map(
          r => r.confidence
        );
        result.summary.averageConfidence =
          allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length;

        logger.info(
          `Debate completed, new average confidence: ${result.summary.averageConfidence.toFixed(2)}`
        );
      } catch (error) {
        logger.error('Debate execution failed:', error);
        // Continue with original results
      }
    }

    return result;
  }

  /**
   * Execute a preset workflow
   * @param workflowName - Name of preset workflow
   * @param input - Standard agent input
   */
  async executeWorkflow(
    workflowName: PresetWorkflowName,
    input: StandardAgentInput
  ): Promise<{
    status: WorkflowStatus;
    results: Map<string, any>;
    metrics: any;
  }> {
    logger.info(`[Orchestrator] Executing preset workflow: ${workflowName}`);
    
    const workflow = getPresetWorkflow(workflowName);
    return await workflowExecutor.execute(workflow, input);
  }

  /**
   * Execute a custom workflow configuration
   * @param config - Custom workflow configuration
   * @param input - Standard agent input
   */
  async executeCustomWorkflow(
    config: WorkflowConfig,
    input: StandardAgentInput
  ): Promise<{
    status: WorkflowStatus;
    results: Map<string, any>;
    metrics: any;
  }> {
    logger.info(`[Orchestrator] Executing custom workflow: ${config.name}`);
    
    return await workflowExecutor.execute(config, input);
  }
}

/**
 * Singleton instance export
 */
export const multiAgentOrchestrator = MultiAgentOrchestrator.getInstance();
