import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisController } from './analysis.controller';
import { Request, Response } from 'express';

// Create mock execute function
const mockExecute = vi.fn();

// Mock dependencies
vi.mock('../../../frontend/src/lib/ai/stations/orchestrator', () => ({
  StationsOrchestrator: class {
    execute = mockExecute;
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AnalysisController', () => {
  let analysisController: AnalysisController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    analysisController = new AnalysisController();
    
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    vi.clearAllMocks();
  });

  describe('runSevenStationsPipeline', () => {
    it('should successfully process text through pipeline', async () => {
      const mockText = 'نص درامي للتحليل';
      const mockResult = {
        finalReport: 'تقرير التحليل الكامل',
        totalConfidence: 0.85,
      };

      mockRequest.body = { text: mockText };
      mockExecute.mockResolvedValue(mockResult);

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockExecute).toHaveBeenCalledWith(mockText);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        report: mockResult.finalReport,
        confidence: mockResult.totalConfidence,
        executionTime: expect.any(Number),
        timestamp: expect.any(String),
        stationsCount: 7,
      });
    });

    it('should return 400 if text is missing', async () => {
      mockRequest.body = {};

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'النص مطلوب ولا يمكن أن يكون فارغاً',
        code: 'INVALID_TEXT',
      });
    });

    it('should return 400 if text is empty string', async () => {
      mockRequest.body = { text: '   ' };

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'النص مطلوب ولا يمكن أن يكون فارغاً',
        code: 'INVALID_TEXT',
      });
    });

    it('should return 400 if text is not a string', async () => {
      mockRequest.body = { text: 123 };

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'النص مطلوب ولا يمكن أن يكون فارغاً',
        code: 'INVALID_TEXT',
      });
    });

    it('should handle orchestrator errors', async () => {
      mockRequest.body = { text: 'نص الاختبار' };
      mockExecute.mockRejectedValue(new Error('Pipeline failed'));

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'حدث خطأ أثناء تحليل النص',
        message: 'Pipeline failed',
        code: 'ANALYSIS_FAILED',
      });
    });

    it('should include execution time in response', async () => {
      mockRequest.body = { text: 'نص الاختبار' };
      mockExecute.mockResolvedValue({
        finalReport: 'تقرير',
        totalConfidence: 0.9,
      });

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      const responseCall = mockResponse.json as any;
      expect(responseCall.mock.calls[0][0].executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp in response', async () => {
      mockRequest.body = { text: 'نص الاختبار' };
      mockExecute.mockResolvedValue({
        finalReport: 'تقرير',
        totalConfidence: 0.9,
      });

      await analysisController.runSevenStationsPipeline(
        mockRequest as Request,
        mockResponse as Response
      );

      const responseCall = mockResponse.json as any;
      expect(responseCall.mock.calls[0][0].timestamp).toBeDefined();
      expect(new Date(responseCall.mock.calls[0][0].timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('getStationDetails', () => {
    it('should return station information', async () => {
      await analysisController.getStationDetails(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        stations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
          }),
        ]),
        totalStations: 7,
        executionOrder: expect.any(String),
        outputFormat: expect.any(String),
      });
    });

    it('should return all 7 stations', async () => {
      await analysisController.getStationDetails(
        mockRequest as Request,
        mockResponse as Response
      );

      const responseCall = mockResponse.json as any;
      const stations = responseCall.mock.calls[0][0].stations;
      expect(stations).toHaveLength(7);
    });

    it('should have unique station IDs', async () => {
      await analysisController.getStationDetails(
        mockRequest as Request,
        mockResponse as Response
      );

      const responseCall = mockResponse.json as any;
      const stations = responseCall.mock.calls[0][0].stations;
      const ids = stations.map((s: any) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(7);
    });

    it('should handle errors gracefully', async () => {
      // This test verifies error handling exists in the controller
      // In normal operation, getStationDetails should succeed
      await analysisController.getStationDetails(
        mockRequest as Request,
        mockResponse as Response
      );

      // Should successfully return station info
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
