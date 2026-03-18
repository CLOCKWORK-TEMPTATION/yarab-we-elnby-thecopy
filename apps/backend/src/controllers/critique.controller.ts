/**
 * Critique Controller
 * وحدة تحكم النقد الذاتي المحسن
 * 
 * Handles endpoints for enhanced self-critique functionality
 */

import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { enhancedSelfCritiqueModule } from '@/services/agents/shared/enhancedSelfCritique';
import { getCritiqueConfiguration, getAllCritiqueConfigurations } from '@/services/agents/shared/critiqueConfigurations';
import { TaskType } from '@core/types';
import type { CritiqueConfiguration, EnhancedCritiqueResult, CritiqueRequest, CritiqueContext } from '@/services/agents/shared/critiqueTypes';

export class CritiqueController {
  /**
   * Get all critique configurations
   * الحصول على جميع تكوينات النقد
   */
  async getAllCritiqueConfigs(req: Request, res: Response): Promise<void> {
    try {
      const configurations = getAllCritiqueConfigurations();
      
      res.json({
        success: true,
        data: configurations,
        count: configurations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[CritiqueController] Error getting all configurations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve critique configurations',
        code: 'CONFIGS_RETRIEVAL_ERROR'
      });
    }
  }

  /**
   * Get critique configuration for specific task type
   * الحصول على تكوين النقد لنوع المهمة المحدد
   */
  async getCritiqueConfig(req: Request, res: Response): Promise<void> {
    try {
      const { taskType } = req.params;
      
      if (!taskType || !Object.values(TaskType).includes(taskType as TaskType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid task type',
          code: 'INVALID_TASK_TYPE'
        });
        return;
      }

      const configuration = getCritiqueConfiguration(taskType as TaskType);
      
      if (!configuration) {
        res.status(404).json({
          success: false,
          error: `No critique configuration found for task type: ${taskType}`,
          code: 'CONFIG_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: configuration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`[CritiqueController] Error getting config for ${req.params.taskType}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve critique configuration',
        code: 'CONFIG_RETRIEVAL_ERROR'
      });
    }
  }

  /**
   * Get dimension details for specific task type
   * الحصول على تفاصيل الأبعاد لنوع المهمة المحدد
   */
  async getDimensionDetails(req: Request, res: Response): Promise<void> {
    try {
      const { taskType } = req.params;
      
      if (!taskType || !Object.values(TaskType).includes(taskType as TaskType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid task type',
          code: 'INVALID_TASK_TYPE'
        });
        return;
      }

      const configuration = getCritiqueConfiguration(taskType as TaskType);
      
      if (!configuration) {
        res.status(404).json({
          success: false,
          error: `No critique configuration found for task type: ${taskType}`,
          code: 'CONFIG_NOT_FOUND'
        });
        return;
      }

      const dimensionDetails = {
        dimensions: configuration.dimensions,
        thresholds: configuration.thresholds,
        maxIterations: configuration.maxIterations,
        enableAutoCorrection: configuration.enableAutoCorrection
      };

      res.json({
        success: true,
        data: dimensionDetails,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`[CritiqueController] Error getting dimension details for ${req.params.taskType}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dimension details',
        code: 'DIMENSIONS_RETRIEVAL_ERROR'
      });
    }
  }

  /**
   * Get critique summary for output
   * الحصول على ملخص نقد للمخرجات
   */
  async getCritiqueSummary(req: Request, res: Response): Promise<void> {
    try {
      const { output, task, context, customConfig } = req.body;

      // Validate required fields
      if (!output || !task || !context) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: output, task, or context',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }

      // Validate context structure
      if (!context.taskType || !context.originalText) {
        res.status(400).json({
          success: false,
          error: 'Context must include taskType and originalText',
          code: 'INVALID_CONTEXT'
        });
        return;
      }

      // Validate task type
      if (!Object.values(TaskType).includes(context.taskType as TaskType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid task type in context',
          code: 'INVALID_TASK_TYPE'
        });
        return;
      }

      const critiqueRequest: CritiqueRequest = {
        output,
        task,
        context: context as CritiqueContext,
        customConfig
      };

      logger.info('[CritiqueController] Starting enhanced critique', {
        taskType: context.taskType,
        outputLength: output.length,
        taskLength: task.length
      });

      const result: EnhancedCritiqueResult = await enhancedSelfCritiqueModule.applyEnhancedCritique(critiqueRequest);

      logger.info('[CritiqueController] Enhanced critique completed', {
        taskType: context.taskType,
        overallScore: result.overallScore,
        overallLevel: result.overallLevel,
        improved: result.improved,
        iterations: result.iterations
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[CritiqueController] Error applying critique:', error);
      
      if (error instanceof Error && error.message.includes('No critique configuration found')) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: 'CONFIG_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to apply critique',
        code: 'CRITIQUE_APPLICATION_ERROR'
      });
    }
  }
}

// Export singleton instance
export const critiqueController = new CritiqueController();