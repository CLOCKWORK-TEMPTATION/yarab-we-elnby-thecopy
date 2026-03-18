/**
 * Embeddings Service - Text embedding generation with caching
 *
 * This service provides:
 * 1. Text embedding generation using Google Gemini
 * 2. Cosine similarity calculation
 * 3. Redis caching for embeddings
 * 4. Semantic similarity threshold determination
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";
import { cacheService } from "../cache.service";

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || "";
const EMBEDDING_MODEL = "text-embedding-004"; // Gemini embedding model
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days cache for embeddings

/**
 * Embeddings Service Class
 */
export class EmbeddingsService {
  private genAI: GoogleGenerativeAI;
  private embeddingCache: Map<string, number[]>;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.embeddingCache = new Map();
  }

  /**
   * Get embedding for a text string
   * Uses cache to avoid redundant API calls
   */
  async getEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }

    // Generate cache key
    const cacheKey = this.getCacheKey(text);

    // Check in-memory cache first
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    // Check Redis cache
    try {
      const cached = await cacheService.get(`embedding:${cacheKey}`);
      if (cached) {
        const embedding = JSON.parse(cached as string) as number[];
        this.embeddingCache.set(cacheKey, embedding);
        return embedding;
      }
    } catch (error) {
      console.warn("Redis cache lookup failed:", error);
    }

    // Generate new embedding
    try {
      const model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);

      try {
        await cacheService.set(
          `embedding:${cacheKey}`,
          JSON.stringify(embedding),
          CACHE_TTL
        );
      } catch (error) {
        console.warn("Failed to cache embedding:", error);
      }

      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw new Error("Embedding generation failed");
    }
  }

  /**
   * Get embeddings for multiple texts in batch
   * More efficient than calling getEmbedding multiple times
   */
  async getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    // Filter out empty texts
    const validTexts = texts.filter(t => t && t.trim().length > 0);

    if (validTexts.length === 0) {
      return [];
    }

    // Process in parallel with rate limiting
    const batchSize = 10;
    const results: number[][] = [];

    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.getEmbedding(text))
      );
      results.push(...batchResults);

      // Small delay to avoid rate limits
      if (i + batchSize < validTexts.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate similarity between two texts
   */
  async calculateSimilarity(textA: string, textB: string): Promise<number> {
    const [embeddingA, embeddingB] = await Promise.all([
      this.getEmbedding(textA),
      this.getEmbedding(textB),
    ]);

    return this.cosineSimilarity(embeddingA, embeddingB);
  }

  /**
   * Determine semantic similarity threshold
   * Returns a recommended threshold based on text characteristics
   */
  semanticSimilarityThreshold(
    textLength: number,
    domain: 'general' | 'technical' | 'creative' = 'general'
  ): number {
    // Base thresholds by domain
    const baseThresholds = {
      general: 0.65,
      technical: 0.70,
      creative: 0.60,
    };

    let threshold = baseThresholds[domain];

    // Adjust based on text length
    if (textLength < 100) {
      threshold += 0.05; // Shorter texts need higher similarity
    } else if (textLength > 1000) {
      threshold -= 0.05; // Longer texts can have more variance
    }

    return Math.max(0.5, Math.min(0.9, threshold));
  }

  /**
   * Find most similar texts from a collection
   */
  async findMostSimilar(
    query: string,
    candidates: string[],
    topK: number = 5
  ): Promise<Array<{ text: string; similarity: number; index: number }>> {
    if (candidates.length === 0) {
      return [];
    }

    const queryEmbedding = await this.getEmbedding(query);
    const candidateEmbeddings = await this.getEmbeddingsBatch(candidates);

    const similarities = candidateEmbeddings.map((embedding, index) => ({
      text: candidates[index] ?? '',
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
      index,
    }));

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Generate cache key from text
   */
  private getCacheKey(text: string): string {
    const normalized = text.trim().toLowerCase();
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    inMemoryCacheSize: number;
  } {
    return {
      inMemoryCacheSize: this.embeddingCache.size,
    };
  }
}

// Singleton instance
export const embeddingsService = new EmbeddingsService();
