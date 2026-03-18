/**
 * Enhanced RAG Service - Advanced Retrieval-Augmented Generation
 *
 * This service provides:
 * 1. Semantic chunking of documents
 * 2. Embedding-based similarity search
 * 3. Relevance ranking and filtering
 * 4. Context augmentation for LLM prompts
 */

import { SemanticChunker, SemanticChunk } from './semanticChunker';
import { embeddingsService } from './embeddings.service';

export interface EnhancedRAGOptions {
  maxChunks?: number;
  minRelevanceScore?: number;
  chunkSize?: number;
  coherenceThreshold?: number;
  enableReranking?: boolean;
}

export interface RetrievedChunk extends SemanticChunk {
  relevanceScore: number;
  rank: number;
}

export interface RAGMetrics {
  totalChunks: number;
  retrievedChunks: number;
  avgRelevanceScore: number;
  precision: number;
  recall: number;
  processingTimeMs: number;
}

const DEFAULT_OPTIONS: EnhancedRAGOptions = {
  maxChunks: 5,
  minRelevanceScore: 0.65,
  chunkSize: 800,
  coherenceThreshold: 0.6,
  enableReranking: true,
};

/**
 * Enhanced RAG Service Class
 */
export class EnhancedRAGService {
  private chunker: SemanticChunker;
  private options: EnhancedRAGOptions;

  constructor(options: EnhancedRAGOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.chunker = new SemanticChunker({
      maxChunkSize: this.options.chunkSize ?? 800,
      coherenceThreshold: this.options.coherenceThreshold ?? 0.6,
    });
  }

  /**
   * Perform RAG on a document
   * Returns relevant chunks for a given query
   */
  async performRAG(
    query: string,
    document: string
  ): Promise<{
    chunks: RetrievedChunk[];
    metrics: RAGMetrics;
  }> {
    const startTime = Date.now();

    // Step 1: Chunk the document semantically
    const chunks = await this.chunker.chunkText(
      document,
      (text) => embeddingsService.getEmbedding(text)
    );

    if (chunks.length === 0) {
      return {
        chunks: [],
        metrics: {
          totalChunks: 0,
          retrievedChunks: 0,
          avgRelevanceScore: 0,
          precision: 0,
          recall: 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }

    // Step 2: Retrieve relevant chunks
    const retrievedChunks = await this.retrieveRelevantChunks(query, chunks);

    // Step 3: Rank chunks by relevance
    const rankedChunks = await this.rankChunksByRelevance(
      query,
      retrievedChunks
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(
      chunks.length,
      rankedChunks,
      Date.now() - startTime
    );

    return {
      chunks: rankedChunks,
      metrics,
    };
  }

  /**
   * Retrieve relevant chunks using semantic similarity
   */
  async retrieveRelevantChunks(
    query: string,
    chunks: SemanticChunk[]
  ): Promise<RetrievedChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    // Get query embedding
    const queryEmbedding = await embeddingsService.getEmbedding(query);

    // Get embeddings for all chunks
    const chunkTexts = chunks.map(c => c.text);
    const chunkEmbeddings = await embeddingsService.getEmbeddingsBatch(chunkTexts);

    // Calculate relevance scores
    const retrievedChunks: RetrievedChunk[] = chunks
      .map((chunk, index) => {
        const relevanceScore = embeddingsService.cosineSimilarity(
          queryEmbedding,
          chunkEmbeddings[index] ?? []
        );

        return {
          ...chunk,
          relevanceScore,
          rank: 0, // Will be set in ranking step
        };
      })
      .filter(chunk => chunk.relevanceScore >= (this.options.minRelevanceScore || 0.65));

    return retrievedChunks;
  }

  /**
   * Rank chunks by relevance with optional re-ranking
   */
  async rankChunksByRelevance(
    query: string,
    chunks: RetrievedChunk[]
  ): Promise<RetrievedChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    let rankedChunks = [...chunks];

    // Initial ranking by relevance score
    rankedChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply re-ranking if enabled
    if (this.options.enableReranking && rankedChunks.length > 1) {
      rankedChunks = await this.rerank(query, rankedChunks);
    }

    // Assign ranks and limit to maxChunks
    const maxChunks = this.options.maxChunks || 5;
    rankedChunks = rankedChunks.slice(0, maxChunks).map((chunk, index) => ({
      ...chunk,
      rank: index + 1,
    }));

    return rankedChunks;
  }

  /**
   * Re-rank chunks using additional signals
   * Considers: relevance score, coherence score, chunk position
   */
  private async rerank(
    query: string,
    chunks: RetrievedChunk[]
  ): Promise<RetrievedChunk[]> {
    // Calculate composite scores
    const rerankedChunks = chunks.map(chunk => {
      // Components of the score:
      // 1. Relevance score (70% weight)
      // 2. Coherence score (20% weight)
      // 3. Position bonus (10% weight) - earlier chunks get slight boost
      const maxPosition = chunks.length;
      const positionInDoc = chunk.startIndex;
      const positionScore = 1 - (positionInDoc / maxPosition) * 0.2; // Small position boost

      const compositeScore =
        chunk.relevanceScore * 0.7 +
        chunk.coherenceScore * 0.2 +
        positionScore * 0.1;

      return {
        ...chunk,
        relevanceScore: compositeScore, // Update with composite score
      };
    });

    // Re-sort by composite score
    rerankedChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return rerankedChunks;
  }

  /**
   * Build augmented prompt with retrieved chunks
   */
  buildAugmentedPrompt(
    basePrompt: string,
    chunks: RetrievedChunk[]
  ): string {
    if (chunks.length === 0) {
      return basePrompt;
    }

    const contextSection = chunks
      .map((chunk, i) => {
        return `[سياق ${i + 1} - ملاءمة: ${(chunk.relevanceScore * 100).toFixed(0)}%]\n${chunk.text}`;
      })
      .join('\n\n');

    return `${basePrompt}\n\n=== سياق ذو صلة من النص ===\n${contextSection}\n\n=== نهاية السياق ===\n`;
  }

  /**
   * Calculate RAG performance metrics
   */
  private calculateMetrics(
    totalChunks: number,
    retrievedChunks: RetrievedChunk[],
    processingTimeMs: number
  ): RAGMetrics {
    const numRetrieved = retrievedChunks.length;

    const avgRelevanceScore =
      numRetrieved > 0
        ? retrievedChunks.reduce((sum, c) => sum + c.relevanceScore, 0) / numRetrieved
        : 0;

    // Precision: percentage of retrieved chunks that are highly relevant (>0.75)
    const highlyRelevant = retrievedChunks.filter(c => c.relevanceScore > 0.75).length;
    const precision = numRetrieved > 0 ? highlyRelevant / numRetrieved : 0;

    // Recall: estimated based on retrieved vs total (simplified metric)
    const maxExpectedRelevant = Math.min(5, totalChunks);
    const recall = maxExpectedRelevant > 0 ? numRetrieved / maxExpectedRelevant : 0;

    return {
      totalChunks,
      retrievedChunks: numRetrieved,
      avgRelevanceScore: Math.round(avgRelevanceScore * 100) / 100,
      precision: Math.round(precision * 100) / 100,
      recall: Math.min(1, Math.round(recall * 100) / 100),
      processingTimeMs,
    };
  }

  /**
   * Update options
   */
  setOptions(options: Partial<EnhancedRAGOptions>): void {
    this.options = { ...this.options, ...options };
    this.chunker = new SemanticChunker({
      maxChunkSize: this.options.chunkSize ?? 800,
      coherenceThreshold: this.options.coherenceThreshold ?? 0.6,
    });
  }

  /**
   * Get current options
   */
  getOptions(): EnhancedRAGOptions {
    return { ...this.options };
  }
}

// Singleton instance
export const enhancedRAGService = new EnhancedRAGService();
