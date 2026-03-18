/**
 * Workflow Executor - Executes multi-agent workflows with dependency management
 */

import { logger } from '@/utils/logger';
import { TaskType } from './enums';
import { StandardAgentInput, StandardAgentOutput } from './types';
import {
  WorkflowConfig,
  WorkflowContext,
  WorkflowExecutionPlan,
  WorkflowStage,
  WorkflowStatus,
  AgentStatus,
  AgentExecutionResult,
  WorkflowMetrics,
  WorkflowEvent,
} from './workflow-types';
import { agentRegistry } from '../registry';

export class WorkflowExecutor {
  private listeners: Map<string, Array<(event: WorkflowEvent) => void>> = new Map();

  /**
   * Execute a workflow
   */
  async execute(
    config: WorkflowConfig,
    input: StandardAgentInput
  ): Promise<{
    status: WorkflowStatus;
    results: Map<string, AgentExecutionResult>;
    metrics: WorkflowMetrics;
  }> {
    const context: WorkflowContext = {
      workflowId: config.id,
      input,
      results: new Map(),
      sharedData: new Map(),
      metadata: {
        startedAt: new Date(),
        totalSteps: config.steps.length,
        completedSteps: 0,
        failedSteps: 0,
      },
    };

    logger.info(`[Workflow] Starting workflow: ${config.name} (${config.id})`);

    try {
      // Build execution plan
      const plan = this.buildExecutionPlan(config);

      // Execute stages
      for (const stage of plan.stages) {
        await this.executeStage(stage, config, context);
      }

      context.metadata.completedAt = new Date();

      // Calculate metrics
      const metrics = this.calculateMetrics(context);

      logger.info(`[Workflow] Completed workflow: ${config.name}`);

      this.emit({
        type: 'workflow-completed',
        workflowId: config.id,
        timestamp: new Date(),
        data: { metrics },
      });

      return {
        status: WorkflowStatus.COMPLETED,
        results: context.results,
        metrics,
      };
    } catch (error) {
      logger.error('[Workflow] Failed to execute workflow:', error);

      this.emit({
        type: 'workflow-failed',
        workflowId: config.id,
        timestamp: new Date(),
        data: { error },
      });

      return {
        status: WorkflowStatus.FAILED,
        results: context.results,
        metrics: this.calculateMetrics(context),
      };
    }
  }

  /**
   * Build execution plan from workflow config
   */
  private buildExecutionPlan(config: WorkflowConfig): WorkflowExecutionPlan {
    const stages: WorkflowStage[] = [];
    const processedSteps = new Set<string>();
    let stageNumber = 0;

    while (processedSteps.size < config.steps.length) {
      const availableSteps = config.steps.filter((step) => {
        if (processedSteps.has(step.id)) return false;

        // Check if all dependencies are satisfied
        return step.dependencies.every((dep) =>
          Array.from(processedSteps).some((id) =>
            config.steps.find((s) => s.id === id && s.agentId === dep.agentId)
          )
        );
      });

      if (availableSteps.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }

      // Group parallel steps
      const parallelSteps = availableSteps.filter((s) => s.parallel);
      const sequentialSteps = availableSteps.filter((s) => !s.parallel);

      if (parallelSteps.length > 0) {
        stages.push({
          stageNumber: stageNumber++,
          steps: parallelSteps,
          dependencies: [],
          canRunInParallel: true,
        });
        parallelSteps.forEach((s) => processedSteps.add(s.id));
      }

      if (sequentialSteps.length > 0) {
        // Add each sequential step as its own stage
        sequentialSteps.forEach((step) => {
          stages.push({
            stageNumber: stageNumber++,
            steps: [step],
            dependencies: [],
            canRunInParallel: false,
          });
          processedSteps.add(step.id);
        });
      }
    }

    return { stages };
  }

  /**
   * Execute a workflow stage
   */
  private async executeStage(
    stage: WorkflowStage,
    config: WorkflowConfig,
    context: WorkflowContext
  ): Promise<void> {
    logger.info(`[Workflow] Executing stage ${stage.stageNumber} with ${stage.steps.length} steps`);

    if (stage.canRunInParallel) {
      // Execute steps in parallel
      const promises = stage.steps.map((step) =>
        this.executeStep(step, config, context)
      );
      await Promise.all(promises);
    } else {
      // Execute steps sequentially
      for (const step of stage.steps) {
        await this.executeStep(step, config, context);
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: any,
    config: WorkflowConfig,
    context: WorkflowContext
  ): Promise<void> {
    const startTime = new Date();

    logger.info(`[Workflow] Executing step: ${step.id} (${step.agentId})`);

    this.emit({
      type: 'step-started',
      workflowId: config.id,
      stepId: step.id,
      timestamp: startTime,
    });

    try {
      // Check dependencies
      const dependenciesMet = this.checkDependencies(step, context);
      if (!dependenciesMet) {
        if (step.skipOnError) {
          logger.warn(`[Workflow] Skipping step ${step.id} due to unmet dependencies`);
          context.results.set(step.id, {
            agentId: step.agentId,
            taskType: step.taskType,
            status: AgentStatus.SKIPPED,
            startTime,
            endTime: new Date(),
          });
          return;
        } else {
          throw new Error(`Dependencies not met for step ${step.id}`);
        }
      }

      // Get agent from registry
      const agent = agentRegistry.getAgent(step.taskType);
      if (!agent) {
        throw new Error(`Agent not found for task type: ${step.taskType}`);
      }

      // Execute with retry policy
      let output: StandardAgentOutput | undefined;
      let lastError: Error | undefined;
      let retryCount = 0;

      while (retryCount <= (step.retryPolicy?.maxRetries ?? 0)) {
        try {
          output = await this.executeWithTimeout(
            () => agent.executeTask(context.input),
            step.timeout ?? config.globalTimeout ?? 60000
          );
          break;
        } catch (error) {
          lastError = error as Error;
          retryCount++;
          if (retryCount <= (step.retryPolicy?.maxRetries ?? 0)) {
            logger.warn(`[Workflow] Retry ${retryCount} for step ${step.id}`);
            await this.sleep(step.retryPolicy?.backoffMs ?? 1000);
          }
        }
      }

      const endTime = new Date();

      if (output) {
        context.results.set(step.id, {
          agentId: step.agentId,
          taskType: step.taskType,
          status: AgentStatus.COMPLETED,
          output,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          retryCount,
        });

        context.metadata.completedSteps++;

        this.emit({
          type: 'step-completed',
          workflowId: config.id,
          stepId: step.id,
          timestamp: endTime,
          data: { output },
        });
      } else {
        throw lastError || new Error('Step failed without output');
      }
    } catch (error) {
      logger.error(`[Workflow] Step ${step.id} failed:`, error);

      context.results.set(step.id, {
        agentId: step.agentId,
        taskType: step.taskType,
        status: AgentStatus.FAILED,
        error: error as Error,
        startTime,
        endTime: new Date(),
      });

      context.metadata.failedSteps++;

      this.emit({
        type: 'step-failed',
        workflowId: config.id,
        stepId: step.id,
        timestamp: new Date(),
        data: { error },
      });

      if (config.errorHandling === 'strict' && !step.skipOnError) {
        throw error;
      }
    }
  }

  /**
   * Check if step dependencies are met
   */
  private checkDependencies(step: any, context: WorkflowContext): boolean {
    return step.dependencies.every((dep: any) => {
      const depResult = Array.from(context.results.values()).find(
        (r) => r.agentId === dep.agentId && r.taskType === dep.taskType
      );

      if (!depResult || depResult.status !== AgentStatus.COMPLETED) {
        return !dep.required;
      }

      if (dep.minConfidence && depResult.output) {
        return depResult.output.confidence >= dep.minConfidence;
      }

      return true;
    });
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate workflow metrics
   */
  private calculateMetrics(context: WorkflowContext): WorkflowMetrics {
    const results = Array.from(context.results.values());
    const completedResults = results.filter((r) => r.status === AgentStatus.COMPLETED);

    const confidences = completedResults
      .map((r) => r.output?.confidence ?? 0)
      .filter((c) => c > 0);

    const executionTimes = results
      .map((r) => r.duration ?? 0)
      .filter((t) => t > 0);

    const totalTime =
      context.metadata.completedAt && context.metadata.startedAt
        ? context.metadata.completedAt.getTime() - context.metadata.startedAt.getTime()
        : 0;

    return {
      totalExecutionTime: totalTime,
      avgAgentExecutionTime:
        executionTimes.length > 0
          ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
          : 0,
      parallelizationEfficiency:
        executionTimes.length > 0 ? totalTime / executionTimes.reduce((a, b) => a + b, 0) : 0,
      successRate: results.length > 0 ? completedResults.length / results.length : 0,
      confidenceDistribution: {
        min: confidences.length > 0 ? Math.min(...confidences) : 0,
        max: confidences.length > 0 ? Math.max(...confidences) : 0,
        avg: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
        median: confidences.length > 0 ? this.median(confidences) : 0,
      },
    };
  }

  /**
   * Calculate median
   */
  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Event listener management
   */
  on(eventType: string, handler: (event: WorkflowEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  private emit(event: WorkflowEvent): void {
    const handlers = this.listeners.get(event.type) || [];
    handlers.forEach((handler) => handler(event));
  }
}

// Singleton instance
export const workflowExecutor = new WorkflowExecutor();
