import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { queueAIAnalysis } from '@/queues/jobs/ai-analysis.job';
import { AnalysisService } from '@/services/analysis.service';

// تم إيقاف استيراد كود من الواجهة الأمامية لتجنب أخطاء rootDir في TypeScript

export class AnalysisController {
  private analysisService: AnalysisService;

  constructor() {
    this.analysisService = new AnalysisService();
  }

  /**
   * Run Seven Stations Pipeline (asynchronous via queue)
   * Returns a job ID that can be used to check the status
   */
  async runSevenStationsPipeline(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { text, async } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({
          error: 'النص مطلوب ولا يمكن أن يكون فارغاً',
          code: 'INVALID_TEXT'
        });
        return;
      }

      logger.info('بدء تشغيل نظام المحطات السبع', {
        textLength: text.length,
        async: async === true,
        timestamp: new Date().toISOString()
      });

      // If async flag is true, queue the job
      if (async === true) {
        const jobId = await queueAIAnalysis({
          type: 'project',
          entityId: `text_${Date.now()}`, // Generate unique ID for text analysis
          userId: (req as any).user?.id || 'anonymous',
          analysisType: 'full',
          options: { text }
        });

        logger.info('تم إضافة مهمة التحليل إلى قائمة الانتظار', { jobId });

        res.json({
          success: true,
          jobId,
          message: 'تم إضافة التحليل إلى قائمة الانتظار',
          checkStatus: `/api/queue/jobs/${jobId}`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Synchronous execution using AnalysisService
      const pipelineResult = await this.analysisService.runFullPipeline({
        fullText: text,
        projectName: 'تحليل سيناريو',
        language: 'ar',
        context: {},
        flags: {
          runStations: true,
          fastMode: false,
          skipValidation: false,
          verboseLogging: false,
        },
        agents: { temperature: 0.2 },
      });

      const endTime = Date.now();

      // إرجاع النتيجة بتنسيق متقدم
      res.json({
        success: true,
        report: pipelineResult.stationOutputs.station7.details?.finalReport || 'تحليل غير متاح',
        confidence: 0.85, // قيمة افتراضية يمكن تحسينها لاحقاً
        executionTime: endTime - startTime,
        timestamp: new Date().toISOString(),
        stationsCount: 7,
        detailedResults: pipelineResult.stationOutputs,
        metadata: pipelineResult.pipelineMetadata
      });

      logger.info('تم إكمال معالجة مبسّطة بنجاح', {
        executionTime: endTime - startTime,
        confidence: 0.85
      });

    } catch (error) {
      logger.error('فشل في تنفيذ نظام المحطات السبع:', error);

      res.status(500).json({
        error: 'حدث خطأ أثناء تحليل النص',
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
        code: 'ANALYSIS_FAILED'
      });
    }
  }

  async getStationDetails(req: Request, res: Response): Promise<void> {
    try {
      const stationInfo = {
        stations: [
          { id: 'S1', name: 'التحليل التأسيسي', description: 'تحليل البنية الأساسية للنص' },
          { id: 'S2', name: 'التحليل المفاهيمي', description: 'استخراج الثيمات والمفاهيم' },
          { id: 'S3', name: 'شبكة الصراعات', description: 'تحليل العلاقات والصراعات' },
          { id: 'S4', name: 'مقاييس الفعالية', description: 'قياس فعالية النص الدرامي' },
          { id: 'S5', name: 'الديناميكية والرمزية', description: 'تحليل الرموز والديناميكية' },
          { id: 'S6', name: 'الفريق الأحمر', description: 'التحليل النقدي متعدد الوكلاء' },
          { id: 'S7', name: 'التقرير النهائي', description: 'إنشاء التقرير الشامل' }
        ],
        totalStations: 7,
        executionOrder: 'تسلسلي (1→7)',
        outputFormat: 'نص عربي منسق'
      };
      
      res.json(stationInfo);
    } catch (error) {
      logger.error('فشل في جلب معلومات المحطات:', error);
      res.status(500).json({ error: 'فشل في جلب معلومات المحطات' });
    }
  }
}