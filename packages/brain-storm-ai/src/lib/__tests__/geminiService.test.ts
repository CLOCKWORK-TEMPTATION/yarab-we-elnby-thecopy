/**
 * @file Unit tests for GeminiService with comprehensive error and success scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService } from '../../../agents/core/geminiService';
import { TaskType } from '../../../types/types';
import type { ProcessedFile } from '../../../agents/core/fileReaderService';
import {
  mockSuccessTextResponse,
  mockSuccessJsonResponse,
  mockApiError400,
  mockApiError401,
  mockApiError500,
  mockNetworkError,
  mockBlockedContentResponse,
  mockEmptyCandidatesResponse,
  mockMalformedJsonResponse,
  mockResponseFactory
} from '../__mocks__/gemini.payloads';
import type { AgentConfig } from '../../../config';

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
  },
  HarmBlockThreshold: {
    BLOCK_NONE: 'BLOCK_NONE'
  }
}));

// Mock dependencies
vi.mock('../../../config', () => ({
  environment: { geminiApiKey: 'test-api-key' },
  PROMPT_PERSONA_BASE: 'Test persona base',
  TASK_SPECIFIC_INSTRUCTIONS: {
    [TaskType.ANALYSIS]: 'Analysis instructions'
  },
  TASKS_EXPECTING_JSON_RESPONSE: [TaskType.ANALYSIS],
  COMPLETION_ENHANCEMENT_OPTIONS: [],
  TASK_CATEGORY_MAP: {
    [TaskType.ANALYSIS]: 'ANALYSIS'
  }
}));

vi.mock('../../../agents/instructions/prompts', () => ({
  ENHANCED_TASK_DESCRIPTIONS: {
    [TaskType.ANALYSIS]: 'تحليل: تحليل شامل للنص'
  }
}));

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGenerateContent: ReturnType<typeof vi.fn>;
  const mockConfig: AgentConfig = {
    model: 'gemini-pro',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048
  };

  const mockProcessedFile: ProcessedFile = {
    name: 'test.txt',
    content: 'Test content in Arabic: مرحبا بك',
    mimeType: 'text/plain',
    isBase64: false,
    size: 100
  };

  beforeEach(async () => {
    const { GoogleGenerativeAI } = vi.mocked(await import('@google/generative-ai'));
    const mockAI = new GoogleGenerativeAI('test-key');
    const mockModel = mockAI.getGenerativeModel({ model: 'gemini-pro' });
    mockGenerateContent = mockModel.generateContent as ReturnType<typeof vi.fn>;

    geminiService = new GeminiService('test-api-key', mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error when API key is missing', () => {
      expect(() => new GeminiService('', mockConfig)).toThrow('لم يتم تعيين مفتاح Gemini API في ملف التكوين.');
    });

    it('should initialize successfully with valid API key', () => {
      expect(() => new GeminiService('valid-key', mockConfig)).not.toThrow();
    });
  });

  describe('processTextsWithGemini - Success Scenarios', () => {
    it('should process text response successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        response: mockSuccessTextResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toBe('هذا نص تجريبي باللغة العربية للاختبار');
      expect(result.rawText).toBe('هذا نص تجريبي باللغة العربية للاختبار');
    });

    it('should process JSON response successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        response: mockSuccessJsonResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        analysis: {
          characters: ["محمد", "فاطمة"],
          themes: ["العائلة", "الصداقة"],
          tone: "دراما اجتماعية"
        },
        score: 85
      });
    });

    it('should handle malformed JSON by attempting repair', async () => {
      mockGenerateContent.mockResolvedValue({
        response: mockMalformedJsonResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      // Should fall back to raw text when JSON repair fails
      expect(result.data).toContain('```json');
      expect(result.error).toContain('تم استلام نص غير متوقع بدلاً من JSON');
    });
  });

  describe('processTextsWithGemini - Error Scenarios', () => {
    it('should handle empty candidates response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: mockEmptyCandidatesResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toBe('أرجع Gemini استجابة بدون مرشحين صالحين.');
    });

    it('should handle blocked content response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: mockBlockedContentResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toContain('أنهى Gemini المعالجة بسبب: SAFETY');
    });

    it('should handle API error 400', async () => {
      mockGenerateContent.mockRejectedValue(mockApiError400);

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toContain('خطأ في الطلب إلى Gemini API');
    });

    it('should handle API error 401', async () => {
      mockGenerateContent.mockRejectedValue(mockApiError401);

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toContain('API key not valid');
    });

    it('should handle API error 500 with retry', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(mockApiError500)
        .mockResolvedValueOnce({ response: mockSuccessTextResponse });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      // Should succeed after retry
      expect(result.error).toBeUndefined();
      expect(result.data).toBe('هذا نص تجريبي باللغة العربية للاختبار');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should handle network error with retry exhaustion', async () => {
      const networkError = { ...mockNetworkError, message: 'network error occurred' };
      mockGenerateContent.mockRejectedValue(networkError);

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toContain('network error occurred');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('processTextsWithGemini - Schema Validation', () => {
    it('should handle tasks expecting JSON but receiving text', async () => {
      const textOnlyResponse = mockResponseFactory.success('This is plain text without JSON');
      mockGenerateContent.mockResolvedValue({ response: textOnlyResponse });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS, // This task expects JSON
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toContain('تم استلام نص غير متوقع بدلاً من JSON');
      expect(result.data).toBe('This is plain text without JSON');
    });
  });

  describe('processTextsWithGemini - File Type Handling', () => {
    it('should handle image files with base64 data', async () => {
      const imageFile: ProcessedFile = {
        name: 'test.jpg',
        content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        mimeType: 'image/jpeg',
        isBase64: true,
        size: 150
      };

      mockGenerateContent.mockResolvedValue({
        response: mockSuccessTextResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [imageFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toBeUndefined();
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    mimeType: 'image/jpeg',
                    data: imageFile.content
                  })
                })
              ])
            })
          ])
        })
      );
    });

    it('should handle PDF files with processing note', async () => {
      const pdfFile: ProcessedFile = {
        name: 'test.pdf',
        content: 'JVBERi0xLjQKJcOkw7zDtsOk',
        mimeType: 'application/pdf',
        isBase64: true,
        size: 500
      };

      mockGenerateContent.mockResolvedValue({
        response: mockSuccessTextResponse
      });

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [pdfFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toBeUndefined();
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                expect.objectContaining({
                  text: expect.stringContaining('[ملاحظة: تم إرسال ملف PDF كبيانات')
                })
              ])
            })
          ])
        })
      );
    });
  });

  describe('Error Message Localization', () => {
    it('should provide Arabic error messages for common scenarios', async () => {
      const apiKeyError = { message: 'api_key is invalid', toString: () => 'api_key error' };
      mockGenerateContent.mockRejectedValue(apiKeyError);

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toBe('مفتاح Gemini API مفقود أو غير صالح. يرجى التأكد من تكوين متغير البيئة API_KEY بشكل صحيح.');
    });

    it('should handle content blocking with Arabic message', async () => {
      const blockedError = { message: 'content blocked due to safety policies' };
      mockGenerateContent.mockRejectedValue(blockedError);

      const result = await geminiService.processTextsWithGemini({
        processedFiles: [mockProcessedFile],
        taskType: TaskType.ANALYSIS,
        specialRequirements: '',
        additionalInfo: ''
      });

      expect(result.error).toContain('تم حظر المحتوى بواسطة Gemini API بسبب سياسات الأمان');
    });
  });
});