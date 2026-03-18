/**
 * Semantic Chunker - Advanced text chunking based on semantic coherence
 *
 * Instead of simple character-based chunking, this module:
 * 1. Detects sentence boundaries
 * 2. Calculates semantic similarity between sentences
 * 3. Groups semantically related sentences into coherent chunks
 */

export interface SemanticChunk {
  text: string;
  startIndex: number;
  endIndex: number;
  coherenceScore: number;
  sentences: string[];
}

export interface SemanticChunkerOptions {
  maxChunkSize?: number;
  minChunkSize?: number;
  coherenceThreshold?: number;
  overlapSentences?: number;
}

const DEFAULT_OPTIONS: SemanticChunkerOptions = {
  maxChunkSize: 800,
  minChunkSize: 200,
  coherenceThreshold: 0.6,
  overlapSentences: 1,
};

/**
 * Semantic Chunker Class
 * Provides intelligent text chunking based on semantic boundaries
 */
export class SemanticChunker {
  private options: SemanticChunkerOptions;

  constructor(options: SemanticChunkerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Chunk text into semantically coherent pieces
   */
  async chunkText(
    text: string,
    getEmbedding: (text: string) => Promise<number[]>
  ): Promise<SemanticChunk[]> {
    if (!text || text.length < (this.options.minChunkSize || 200)) {
      return [{
        text,
        startIndex: 0,
        endIndex: text.length,
        coherenceScore: 1.0,
        sentences: [text],
      }];
    }

    // Step 1: Detect sentence boundaries
    const sentences = this.detectSentenceBoundaries(text);

    if (sentences.length === 0) {
      return [];
    }

    // Step 2: Calculate semantic coherence between consecutive sentences
    const coherenceScores = await this.calculateSemanticCoherence(
      sentences,
      getEmbedding
    );

    // Step 3: Merge semantically related sentences into chunks
    const chunks = this.mergeSemanticallyRelated(
      sentences,
      coherenceScores,
      text
    );

    return chunks;
  }

  /**
   * Detect sentence boundaries using multiple heuristics
   */
  detectSentenceBoundaries(text: string): string[] {
    // Arabic sentence endings: . ! ? ؟
    const sentencePattern = /[^.!?؟]+[.!?؟]+/g;
    const matches = text.match(sentencePattern);

    if (matches && matches.length > 0) {
      return matches.map(s => s.trim()).filter(s => s.length > 0);
    }

    // Fallback: split by newlines or periods
    return text
      .split(/[.\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20); // Ignore very short fragments
  }

  /**
   * Calculate semantic coherence between consecutive sentences
   * Returns an array of coherence scores where score[i] represents
   * the coherence between sentence[i] and sentence[i+1]
   */
  async calculateSemanticCoherence(
    sentences: string[],
    getEmbedding: (text: string) => Promise<number[]>
  ): Promise<number[]> {
    if (sentences.length <= 1) {
      return [];
    }

    // Get embeddings for all sentences
    const embeddings = await Promise.all(
      sentences.map(s => getEmbedding(s))
    );

    // Calculate cosine similarity between consecutive sentences
    const coherenceScores: number[] = [];
    for (let i = 0; i < sentences.length - 1; i++) {
      const embeddingA = embeddings[i];
      const embeddingB = embeddings[i + 1];
      if (embeddingA && embeddingB) {
        const similarity = this.cosineSimilarity(embeddingA, embeddingB);
        coherenceScores.push(similarity);
      }
    }

    return coherenceScores;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i] ?? 0;
      const b = vecB[i] ?? 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Merge sentences into chunks based on semantic coherence
   */
  mergeSemanticallyRelated(
    sentences: string[],
    coherenceScores: number[],
    originalText: string
  ): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    let currentChunk: string[] = [];
    let chunkStartIndex = 0;
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (!sentence) continue;

      const sentenceLength = sentence.length;

      // Check if adding this sentence would exceed max chunk size
      const wouldExceedMax = currentLength + sentenceLength > (this.options.maxChunkSize || 800);

      // Check semantic boundary (low coherence = new topic)
      const isSemanticBoundary = i < coherenceScores.length &&
        coherenceScores[i] < (this.options.coherenceThreshold || 0.6);

      // Start a new chunk if:
      // 1. Would exceed max size AND current chunk meets min size
      // 2. Semantic boundary detected AND current chunk meets min size
      if (
        currentChunk.length > 0 &&
        currentLength >= (this.options.minChunkSize || 200) &&
        (wouldExceedMax || isSemanticBoundary)
      ) {
        // Save current chunk
        const chunkText = currentChunk.join(' ');
        const chunkEndIndex = chunkStartIndex + chunkText.length;

        chunks.push({
          text: chunkText,
          startIndex: chunkStartIndex,
          endIndex: chunkEndIndex,
          coherenceScore: this.calculateAverageCoherence(
            currentChunk.length - 1,
            coherenceScores,
            i - currentChunk.length
          ),
          sentences: [...currentChunk],
        });

        // Start new chunk with overlap
        const overlapCount = this.options.overlapSentences || 1;
        if (overlapCount > 0 && currentChunk.length > overlapCount) {
          currentChunk = currentChunk.slice(-overlapCount);
          const overlapText = currentChunk.join(' ');
          chunkStartIndex = chunkEndIndex - overlapText.length;
          currentLength = overlapText.length;
        } else {
          currentChunk = [];
          chunkStartIndex = chunkEndIndex;
          currentLength = 0;
        }
      }

      // Add current sentence to chunk
      currentChunk.push(sentence);
      currentLength += sentenceLength + 1; // +1 for space
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      chunks.push({
        text: chunkText,
        startIndex: chunkStartIndex,
        endIndex: chunkStartIndex + chunkText.length,
        coherenceScore: this.calculateAverageCoherence(
          currentChunk.length - 1,
          coherenceScores,
          sentences.length - currentChunk.length
        ),
        sentences: currentChunk,
      });
    }

    return chunks;
  }

  /**
   * Calculate average coherence for a chunk
   */
  private calculateAverageCoherence(
    numPairs: number,
    coherenceScores: number[],
    startIndex: number
  ): number {
    if (numPairs === 0 || coherenceScores.length === 0) {
      return 1.0;
    }

    let sum = 0;
    let count = 0;

    for (let i = 0; i < numPairs && (startIndex + i) < coherenceScores.length; i++) {
      sum += coherenceScores[startIndex + i];
      count++;
    }

    return count > 0 ? sum / count : 1.0;
  }
}
