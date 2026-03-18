/**
 * RAG Integration Tests
 * Tests the full RAG pipeline from chunking to retrieval
 */

import { describe, it, expect, vi } from 'vitest';
import { SemanticChunker } from '../semanticChunker';
import { EnhancedRAGService } from '../enhancedRAG.service';

// Mock embeddings service for integration tests
vi.mock('../embeddings.service', () => ({
  embeddingsService: {
    getEmbedding: vi.fn(async (text: string) => {
      // Deterministic embeddings based on text content
      const words = text.toLowerCase().split(/\s+/);
      const embedding = new Array(768).fill(0);

      // Simple word-based features
      words.forEach(word => {
        const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const index = hash % 768;
        embedding[index] += 1;
      });

      // Normalize
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => norm > 0 ? val / norm : 0);
    }),

    getEmbeddingsBatch: vi.fn(async (texts: string[]) => {
      const { embeddingsService } = await import('../embeddings.service');
      return Promise.all(texts.map(text => embeddingsService.getEmbedding(text)));
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

describe('RAG Integration Tests', () => {
  describe('Full Pipeline: Chunking + Retrieval', () => {
    it('should chunk and retrieve relevant content', async () => {
      const service = new EnhancedRAGService();

      const query = 'character development and growth';
      const document = `
        في بداية القصة، نرى الشخصية الرئيسية كشخص عادي.
        تمر الشخصية بتجارب صعبة تشكل نموها وتطورها.
        التطور النفسي للشخصية يظهر من خلال تصرفاتها.

        المشهد الثاني يركز على الحوار بين الشخصيات.
        الحوار يكشف الصراعات الداخلية والخارجية.
        النقاشات تعكس وجهات نظر مختلفة.

        في النهاية، نرى تحولاً كبيراً في شخصية البطل.
        النمو الشخصي واضح من خلال القرارات الجديدة.
        التطور يكتمل بقبول الشخصية لذاتها.
      `.trim();

      const result = await service.performRAG(query, document);

      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.metrics.totalChunks).toBeGreaterThan(0);
      expect(result.metrics.retrievedChunks).toBeGreaterThan(0);
      expect(result.metrics.avgRelevanceScore).toBeGreaterThan(0);

      // Verify chunks are sorted by relevance
      for (let i = 0; i < result.chunks.length - 1; i++) {
        expect(result.chunks[i].relevanceScore).toBeGreaterThanOrEqual(
          result.chunks[i + 1].relevanceScore
        );
      }
    });

    it('should handle multi-topic documents', async () => {
      const service = new EnhancedRAGService();

      const document = `
        الفصل الأول: التقديم
        نتعرف على الشخصيات الرئيسية.
        الإعداد للأحداث القادمة.

        الفصل الثاني: الصراع
        تظهر المشاكل والتحديات.
        الشخصيات تواجه صعوبات.

        الفصل الثالث: الحل
        يتم حل المشاكل تدريجياً.
        النهاية السعيدة للقصة.
      `.trim();

      // Test different queries
      const queries = [
        'شخصيات القصة',
        'الصراع والتحديات',
        'نهاية القصة',
      ];

      for (const query of queries) {
        const result = await service.performRAG(query, document);
        expect(result.chunks.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Semantic Coherence', () => {
    it('should group semantically related sentences', async () => {
      const chunker = new SemanticChunker({
        maxChunkSize: 200,
        coherenceThreshold: 0.5,
      });

      // Mock simple embedding function
      const mockGetEmbedding = async (text: string): Promise<number[]> => {
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(100).fill(0);

        words.forEach(word => {
          const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const index = hash % 100;
          embedding[index] += 1;
        });

        return embedding;
      };

      const text = `
        الموضوع الأول عن السياسة. السياسة مهمة جداً.
        الموضوع الثاني عن الرياضة. كرة القدم رياضة شعبية.
        العودة للسياسة مرة أخرى. الانتخابات قادمة.
      `.trim();

      const chunks = await chunker.chunkText(text, mockGetEmbedding);

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.coherenceScore).toBeGreaterThanOrEqual(0);
        expect(chunk.coherenceScore).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate precision and recall', async () => {
      const service = new EnhancedRAGService({
        maxChunks: 3,
        minRelevanceScore: 0.5,
      });

      const query = 'dramatic tension and conflict';
      const document = `
        التوتر الدرامي يتصاعد تدريجياً.
        الصراع بين الشخصيات يزداد حدة.
        اللحظات المشوقة تملأ المشاهد.

        وصف المكان جميل ومفصل.
        الطبيعة خلابة والجو هادئ.

        العودة للتوتر والصراع.
        الذروة الدرامية وشيكة.
      `.repeat(2);

      const result = await service.performRAG(query, document);

      expect(result.metrics.precision).toBeGreaterThan(0);
      expect(result.metrics.precision).toBeLessThanOrEqual(1);
      expect(result.metrics.recall).toBeGreaterThan(0);
      expect(result.metrics.recall).toBeLessThanOrEqual(1);
      expect(result.metrics.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Augmented Prompt Building', () => {
    it('should build complete augmented prompt', async () => {
      const service = new EnhancedRAGService({
        maxChunks: 2,
        minRelevanceScore: 0.3, // Lower threshold for this test
      });

      const query = 'Analyze the dialogue';
      const document = `
        حوار الشخصيات طبيعي وواقعي.
        اللغة المستخدمة مناسبة للسياق.
        التفاعلات تعكس العلاقات بين الشخصيات.
      `.repeat(3);

      const result = await service.performRAG(query, document);
      const augmentedPrompt = service.buildAugmentedPrompt(query, result.chunks);

      expect(augmentedPrompt).toContain(query);
      expect(augmentedPrompt).toContain('سياق ذو صلة');

      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          expect(augmentedPrompt).toContain(chunk.text.substring(0, 20));
        });
      }
    });
  });
});
