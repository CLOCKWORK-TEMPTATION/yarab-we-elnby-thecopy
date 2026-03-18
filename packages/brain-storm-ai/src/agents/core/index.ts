/**
 * @file Agents Facade - Central hub for all agent configurations
 * Provides a unified interface for accessing AI agents while avoiding broken imports
 */

import type { AIAgentConfig } from '../../types/types';

/**
 * Agent categories for organization
 */
export enum AgentCategory {
  CORE = 'core',
  ANALYSIS = 'analysis', 
  GENERATION = 'generation',
  TRANSFORMATION = 'transformation',
  EVALUATION = 'evaluation'
}

/**
 * Simplified agent configuration factory
 */
function createAgentConfig(id: string, name: string, category: AgentCategory, description: string): AIAgentConfig {
  return {
    id,
    name,
    description,
    category: category as any,
    capabilities: {
      multiModal: false,
      reasoningChains: true,
      toolUse: true,
      memorySystem: true,
      selfReflection: true,
      ragEnabled: true,
      vectorSearch: false,
      agentOrchestration: false,
      metacognitive: false,
      adaptiveLearning: true,
      contextualMemory: true,
      crossModalReasoning: false,
      temporalReasoning: true,
      causalReasoning: true,
      analogicalReasoning: true,
      creativeGeneration: true,
      criticalAnalysis: true,
      emotionalIntelligence: true
    },
    modelConfig: {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    systemPrompt: `You are ${name}, ${description}`,
    userPrompt: '',
    expectedOutput: 'Structured analysis and recommendations',
    processingInstructions: 'Process input systematically and provide actionable insights',
    qualityGates: ['accuracy', 'relevance', 'completeness'],
    fallbackBehavior: 'Provide best-effort analysis with confidence indicators',
    confidenceThreshold: 0.7
  };
}

/**
 * Available agents configuration
 */
export const AGENT_CONFIGS = Object.freeze<AIAgentConfig[]>([
  // Core Agents
  createAgentConfig('analysis', 'محلل السيناريو', AgentCategory.ANALYSIS, 'يحلل بنية السيناريو والشخصيات'),
  createAgentConfig('creative', 'المساعد الإبداعي', AgentCategory.GENERATION, 'يساعد في التوليد الإبداعي للمحتوى'),
  createAgentConfig('integrated', 'الوكيل المتكامل', AgentCategory.CORE, 'ينسق بين جميع الوكلاء الأخرى'),
  
  // Analysis Agents
  createAgentConfig('character-analyzer', 'محلل الشخصيات', AgentCategory.ANALYSIS, 'يحلل تطوير الشخصيات وأصواتها'),
  createAgentConfig('dialogue-forensics', 'محلل الحوار', AgentCategory.ANALYSIS, 'يحلل جودة وأصالة الحوار'),
  createAgentConfig('rhythm-mapping', 'محلل الإيقاع', AgentCategory.ANALYSIS, 'يحلل إيقاع السرد والتوتر'),
  createAgentConfig('cultural-analyzer', 'المحلل الثقافي', AgentCategory.ANALYSIS, 'يحلل السياق الثقافي والتاريخي'),
  
  // Generation Agents
  createAgentConfig('scene-generator', 'مولد المشاهد', AgentCategory.GENERATION, 'ينشئ مشاهد جديدة'),
  createAgentConfig('completion', 'مكمل النصوص', AgentCategory.GENERATION, 'يكمل النصوص الناقصة'),
  createAgentConfig('world-builder', 'باني العوالم', AgentCategory.GENERATION, 'يطور عوالم السيناريو'),
  
  // Transformation Agents
  createAgentConfig('adaptive-rewriting', 'معيد الكتابة', AgentCategory.TRANSFORMATION, 'يعيد كتابة النصوص بأساليب مختلفة'),
  createAgentConfig('platform-adapter', 'محول المنصات', AgentCategory.TRANSFORMATION, 'يكيف المحتوى للمنصات المختلفة'),
  
  // Evaluation Agents
  createAgentConfig('audience-resonance', 'محلل الجمهور', AgentCategory.EVALUATION, 'يقيم صدى المحتوى مع الجمهور'),
  createAgentConfig('tension-optimizer', 'محسن التوتر', AgentCategory.EVALUATION, 'يحسن مستويات التوتر الدرامي')
]);

/**
 * Get agents by category
 */
export function getAgentsByCategory(category: AgentCategory): AIAgentConfig[] {
  return AGENT_CONFIGS.filter(agent => agent.category === category);
}

/**
 * Get agent by ID
 */
export function getAgentById(id: string): AIAgentConfig | undefined {
  return AGENT_CONFIGS.find(agent => agent.id === id);
}

/**
 * Agent execution interface
 */
export interface AgentExecutor {
  execute(agentId: string, input: string, context?: any): Promise<any>;
}

/**
 * Enhanced agent executor with dynamic instructions loading
 */
export class SimpleAgentExecutor implements AgentExecutor {
  async execute(agentId: string, input: string, context?: any): Promise<any> {
    const agent = getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    try {
      // Load instructions dynamically
      const { instructionsLoader } = await import('../../services/instructions-loader');
      const instructions = await instructionsLoader.loadInstructions(agentId);
      
      // Enhanced processing with loaded instructions
      const enhancedPrompt = `${instructions.systemPrompt}\n\nالمهام:\n${instructions.instructions.join('\n')}\n\nالمدخل: ${input}`;
      
      return {
        agentId,
        input,
        prompt: enhancedPrompt,
        output: `تحليل محسن من ${agent.name}: ${input}`,
        instructions: instructions.instructions,
        confidence: 0.85,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Fallback to basic processing
      console.warn(`Failed to load instructions for ${agentId}:`, error);
      return {
        agentId,
        input,
        output: `تحليل أساسي من ${agent.name}: ${input}`,
        confidence: 0.7,
        timestamp: new Date().toISOString(),
        error: 'Instructions loading failed, using fallback'
      };
    }
  }
}

// Export instruction loader for external use
