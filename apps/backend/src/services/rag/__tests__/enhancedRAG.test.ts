/**
 * Enhanced RAG Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedRAGService } from '../enhancedRAG.service';

// Mock embeddings service
vi.mock('../embeddings.service', () => ({
  embeddingsService: {
    getEmbedding: vi.fn(async (text: string) => {
      // Return mock embedding based on text hash
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return Array.from({ length: 768 }, (_, i) => Math.sin(hash + i));
    }),
    getEmbeddingsBatch: vi.fn(async (texts: string[]) => {
      return Promise.all(texts.map(async (text) => {
        const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return Array.from({ length: 768 }, (_, i) => Math.sin(hash + i));
      }));
    }),
    cosineSimilarity: vi.fn((vecA: number[], vecB: number[]) => {
      if (vecA.length !== vecB.length) return 0;

      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }

      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }),
  },
}));

describe('EnhancedRAGService', () => {
  let service: EnhancedRAGService;

  beforeEach(() => {
    service = new EnhancedRAGService();
  });

  describe('performRAG', () => {
    it('should retrieve relevant chunks', async () => {
      const query = 'What is the character development?';
      const document = `
        في الفصل الأول، نتعرف على الشخصية الرئيسية.
        تتطور الشخصية عبر الأحداث المختلفة.
        في النهاية، تصل الشخصية إلى تحول كبير.
        الحوار يكشف عن أعماق الشخصيات.
        المؤامرة معقدة ومثيرة للاهتمام.
      `.repeat(5); // Make it long enough

      const result = await service.performRAG(query, document);

      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalChunks).toBeGreaterThan(0);
      expect(result.metrics.processingTimeMs).toBeGreaterThan(0);
    });

    it('should return empty for short documents', async () => {
      const query = 'test';
      const document = 'Short';

      const result = await service.performRAG(query, document);

      expect(result.chunks.length).toBe(0);
      expect(result.metrics.totalChunks).toBe(0);
    });

    it('should filter chunks by relevance threshold', async () => {
      const serviceWithHighThreshold = new EnhancedRAGService({
        minRelevanceScore: 0.9, // Very high threshold
      });

      const query = 'specific query about characters';
      const document = `
        النص هنا لا يحتوي على كلمات مشابهة للاستعلام.
        نتحدث عن مواضيع مختلفة تماماً.
        لا توجد علاقة بين النص والاستعلام.
      `.repeat(10);

      const result = await serviceWithHighThreshold.performRAG(query, document);

      // With high threshold, may get no results
      result.chunks.forEach(chunk => {
        expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should limit number of returned chunks', async () => {
      const serviceWithLimit = new EnhancedRAGService({
        maxChunks: 2,
      });

      const query = 'test';
      const document = 'This is a test. '.repeat(100);

      const result = await serviceWithLimit.performRAG(query, document);

      expect(result.chunks.length).toBeLessThanOrEqual(2);
    });
  });

  describe('retrieveRelevantChunks', () => {
    it('should return empty for no chunks', async () => {
      const result = await service.retrieveRelevantChunks('query', []);
      expect(result.length).toBe(0);
    });

    it('should calculate relevance scores', async () => {
      const mockChunks = [
        {
          text: 'First chunk about characters',
          startIndex: 0,
          endIndex: 30,
          coherenceScore: 0.8,
          sentences: ['First chunk about characters'],
        },
      ];

      const result = await service.retrieveRelevantChunks('characters', mockChunks);

      result.forEach(chunk => {
        expect(chunk.relevanceScore).toBeDefined();
        expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(chunk.relevanceScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('buildAugmentedPrompt', () => {
    it('should build prompt with chunks', () => {
      const basePrompt = 'Analyze this text';
      const chunks = [
        {
          text: 'Relevant chunk 1',
          startIndex: 0,
          endIndex: 16,
          coherenceScore: 0.8,
          sentences: ['Relevant chunk 1'],
          relevanceScore: 0.9,
          rank: 1,
        },
        {
          text: 'Relevant chunk 2',
          startIndex: 17,
          endIndex: 33,
          coherenceScore: 0.7,
          sentences: ['Relevant chunk 2'],
          relevanceScore: 0.85,
          rank: 2,
        },
      ];

      const prompt = service.buildAugmentedPrompt(basePrompt, chunks);

      expect(prompt).toContain(basePrompt);
      expect(prompt).toContain('Relevant chunk 1');
      expect(prompt).toContain('Relevant chunk 2');
      expect(prompt).toContain('سياق ذو صلة');
    });

    it('should return base prompt when no chunks', () => {
      const basePrompt = 'Analyze this text';
      const prompt = service.buildAugmentedPrompt(basePrompt, []);

      expect(prompt).toBe(basePrompt);
    });
  });

  describe('setOptions and getOptions', () => {
    it('should update options', () => {
      const newOptions = {
        maxChunks: 10,
        minRelevanceScore: 0.8,
      };

      service.setOptions(newOptions);
      const options = service.getOptions();

      expect(options.maxChunks).toBe(10);
      expect(options.minRelevanceScore).toBe(0.8);
    });

    it('should preserve other options when updating', () => {
      const initialChunkSize = service.getOptions().chunkSize;

      service.setOptions({ maxChunks: 10 });

      expect(service.getOptions().chunkSize).toBe(initialChunkSize);
    });
  });
});
