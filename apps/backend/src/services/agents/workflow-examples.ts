/**
 * Workflow System Usage Examples
 * Demonstrates how to use the enhanced workflow system
 */

import { multiAgentOrchestrator } from './orchestrator';
import { createWorkflow, getPresetWorkflow } from './core';
import { TaskType } from './core/enums';
import { StandardAgentInput } from './core/types';

/**
 * Example 1: Using Preset Workflows
 */
async function examplePresetWorkflow() {
  const input: StandardAgentInput = {
    input: 'نص السيناريو هنا...',
    context: {
      projectName: 'فيلم تجريبي',
      projectType: 'film',
    },
  };

  // Execute standard 7-agent workflow
  const result = await multiAgentOrchestrator.executeWorkflow('standard', input);
  
  console.log('Workflow Status:', result.status);
  console.log('Success Rate:', result.metrics.successRate);
  console.log('Total Time:', result.metrics.totalExecutionTime, 'ms');
}

/**
 * Example 2: Fast Parallel Analysis
 */
async function exampleFastAnalysis() {
  const input: StandardAgentInput = {
    input: 'نص السيناريو...',
    context: { projectName: 'تحليل سريع' },
  };

  // Use fast parallel workflow for quick feedback
  const result = await multiAgentOrchestrator.executeWorkflow('fast', input);
  
  console.log('Analysis completed in:', result.metrics.totalExecutionTime, 'ms');
  console.log('Parallelization efficiency:', result.metrics.parallelizationEfficiency);
}

/**
 * Example 3: Building Custom Workflow
 */
async function exampleCustomWorkflow() {
  // Build custom workflow using fluent API
  const customWorkflow = createWorkflow('My Custom Analysis', 'Custom analysis workflow')
    .addStep('character-deep-analyzer', TaskType.CHARACTER_DEEP_ANALYZER, {
      timeout: 60000,
      retryPolicy: { maxRetries: 3, backoffMs: 2000 },
    })
    .addDependentStep(
      'dialogue-advanced-analyzer',
      TaskType.DIALOGUE_ADVANCED_ANALYZER,
      [
        { 
          agentId: 'character-deep-analyzer', 
          taskType: TaskType.CHARACTER_DEEP_ANALYZER,
          minConfidence: 0.75 
        }
      ]
    )
    .addParallelSteps([
      { agentId: 'themes-messages-analyzer', taskType: TaskType.THEMES_MESSAGES_ANALYZER },
      { agentId: 'visual-cinematic-analyzer', taskType: TaskType.VISUAL_CINEMATIC_ANALYZER },
    ])
    .withConcurrency(3)
    .withTimeout(180000) // 3 minutes
    .withErrorHandling('lenient')
    .build();

  const input: StandardAgentInput = {
    input: 'نص السيناريو...',
    context: {},
  };

  const result = await multiAgentOrchestrator.executeCustomWorkflow(customWorkflow, input);
  
  console.log('Custom workflow completed:', result.status);
}

/**
 * Example 4: Character-Focused Deep Analysis
 */
async function exampleCharacterAnalysis() {
  const input: StandardAgentInput = {
    input: 'نص يحتوي على شخصيات معقدة...',
    context: { 
      projectName: 'تحليل الشخصيات',
      focus: 'characters'
    },
  };

  // Use character-focused preset
  const result = await multiAgentOrchestrator.executeWorkflow('character', input);
  
  // Access specific agent results
  for (const [stepId, agentResult] of result.results) {
    console.log(`Step ${stepId}:`, {
      status: agentResult.status,
      confidence: agentResult.output?.confidence,
      duration: agentResult.duration,
    });
  }
}

/**
 * Example 5: Complete Analysis with All Agents
 */
async function exampleCompleteAnalysis() {
  const input: StandardAgentInput = {
    input: 'نص كامل للسيناريو...',
    context: {
      projectName: 'تحليل شامل',
      projectType: 'film',
    },
  };

  // Execute complete workflow with all available agents
  const result = await multiAgentOrchestrator.executeWorkflow('complete', input);
  
  console.log('Complete Analysis Results:');
  console.log('- Total steps:', result.metrics.successRate * 100, '%');
  console.log('- Average confidence:', result.metrics.confidenceDistribution.avg);
  console.log('- Total execution time:', result.metrics.totalExecutionTime, 'ms');
  console.log('- Average agent time:', result.metrics.avgAgentExecutionTime, 'ms');
}

/**
 * Example 6: Creative Development Workflow
 */
async function exampleCreativeWorkflow() {
  const input: StandardAgentInput = {
    input: 'فكرة أولية للقصة...',
    context: {
      projectName: 'تطوير إبداعي',
      mode: 'creative',
    },
  };

  // Use creative development workflow
  const result = await multiAgentOrchestrator.executeWorkflow('creative', input);
  
  console.log('Creative development completed');
  console.log('Generated content quality:', result.metrics.confidenceDistribution.avg);
}

/**
 * Example 7: Workflow with Event Monitoring
 */
async function exampleWithMonitoring() {
  const { workflowExecutor } = await import('./core');
  
  // Subscribe to workflow events
  workflowExecutor.on('step-started', (event) => {
    console.log(`[${event.timestamp.toISOString()}] Step started: ${event.stepId}`);
  });

  workflowExecutor.on('step-completed', (event) => {
    console.log(`[${event.timestamp.toISOString()}] Step completed: ${event.stepId}`);
    console.log('Confidence:', event.data?.output?.confidence);
  });

  workflowExecutor.on('step-failed', (event) => {
    console.error(`[${event.timestamp.toISOString()}] Step failed: ${event.stepId}`);
    console.error('Error:', event.data?.error);
  });

  workflowExecutor.on('workflow-completed', (event) => {
    console.log(`[${event.timestamp.toISOString()}] Workflow completed!`);
    console.log('Metrics:', event.data?.metrics);
  });

  // Execute workflow
  const input: StandardAgentInput = {
    input: 'نص السيناريو...',
    context: {},
  };

  await multiAgentOrchestrator.executeWorkflow('standard', input);
}

/**
 * Example 8: Advanced Modules Workflow
 */
async function exampleAdvancedModules() {
  const input: StandardAgentInput = {
    input: 'نص متقدم يحتاج تحليل عميق...',
    context: {
      projectName: 'تحليل متقدم',
      enableAdvancedModules: true,
    },
  };

  // Execute advanced modules workflow
  const result = await multiAgentOrchestrator.executeWorkflow('advanced', input);
  
  console.log('Advanced analysis completed');
  console.log('Confidence distribution:', result.metrics.confidenceDistribution);
}

/**
 * Example 9: Error Handling Strategies
 */
async function exampleErrorHandling() {
  // Strict error handling - fail on first error
  const strictWorkflow = createWorkflow('Strict Workflow')
    .addStep('character-deep-analyzer', TaskType.CHARACTER_DEEP_ANALYZER)
    .addStep('dialogue-advanced-analyzer', TaskType.DIALOGUE_ADVANCED_ANALYZER)
    .withErrorHandling('strict') // Will stop on first error
    .build();

  // Lenient error handling - continue on errors
  const lenientWorkflow = createWorkflow('Lenient Workflow')
    .addStep('character-deep-analyzer', TaskType.CHARACTER_DEEP_ANALYZER, {
      skipOnError: true,
    })
    .addStep('dialogue-advanced-analyzer', TaskType.DIALOGUE_ADVANCED_ANALYZER, {
      skipOnError: true,
    })
    .withErrorHandling('lenient') // Will continue despite errors
    .build();

  const input: StandardAgentInput = {
    input: 'نص اختبار...',
    context: {},
  };

  try {
    await multiAgentOrchestrator.executeCustomWorkflow(strictWorkflow, input);
  } catch (error) {
    console.error('Strict workflow failed:', error);
  }

  const lenientResult = await multiAgentOrchestrator.executeCustomWorkflow(lenientWorkflow, input);
  console.log('Lenient workflow completed with', lenientResult.metrics.successRate * 100, '% success');
}

/**
 * Example 10: Combining Workflows with Traditional Orchestration
 */
async function exampleHybridApproach() {
  const input: StandardAgentInput = {
    input: 'نص السيناريو...',
    context: {
      projectName: 'تحليل هجين',
    },
  };

  // First: Run quick workflow for initial analysis
  const quickResult = await multiAgentOrchestrator.executeWorkflow('quick', input);
  
  console.log('Quick analysis confidence:', quickResult.metrics.confidenceDistribution.avg);

  // Second: If confidence is low, run complete analysis
  if (quickResult.metrics.confidenceDistribution.avg < 0.7) {
    console.log('Low confidence detected, running complete analysis...');
    const completeResult = await multiAgentOrchestrator.executeWorkflow('complete', input);
    console.log('Complete analysis finished with confidence:', 
      completeResult.metrics.confidenceDistribution.avg);
  }
}

export {
  examplePresetWorkflow,
  exampleFastAnalysis,
  exampleCustomWorkflow,
  exampleCharacterAnalysis,
  exampleCompleteAnalysis,
  exampleCreativeWorkflow,
  exampleWithMonitoring,
  exampleAdvancedModules,
  exampleErrorHandling,
  exampleHybridApproach,
};
