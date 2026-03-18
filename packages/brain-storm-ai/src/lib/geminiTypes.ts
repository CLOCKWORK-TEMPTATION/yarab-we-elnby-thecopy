/**
 * @file Strict TypeScript types for Gemini API integration
 * Provides comprehensive type safety for requests, responses, and error handling
 */

import type { GenerateContentCandidate, FinishReason } from "@google/generative-ai";

/**
 * Represents the structure of a successful Gemini API response
 */
export interface GeminiSuccessResponse {
  candidates: GenerateContentCandidate[];
  finishReason?: FinishReason;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

/**
 * Represents different types of API errors that can occur
 */
export interface GeminiApiError {
  status: number;
  message: string;
  code?: string;
  details?: Array<{
    "@type": string;
    reason?: string;
    domain?: string;
    metadata?: Record<string, string>;
  }>;
}

/**
 * Network-level errors (timeouts, connection issues)
 */
export interface GeminiNetworkError {
  type: 'NETWORK_ERROR';
  message: string;
  originalError?: Error;
}

/**
 * Schema validation errors when response doesn't match expected format
 */
export interface GeminiSchemaError {
  type: 'SCHEMA_MISMATCH';
  message: string;
  expectedSchema: string;
  receivedData: unknown;
}

/**
 * Union type for all possible error scenarios
 */
export type GeminiError = GeminiApiError | GeminiNetworkError | GeminiSchemaError;

/**
 * Enhanced response type with strict error handling
 */
export interface GeminiServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  rawText?: string;
  error?: GeminiError;
  metadata?: {
    tokensUsed?: number;
    finishReason?: FinishReason;
    processingTime?: number;
  };
}

/**
 * Type guard to check if response contains candidate data
 */
export function hasCandidates(response: any): response is { candidates: GenerateContentCandidate[] } {
  return response &&
         Array.isArray(response.candidates) &&
         response.candidates.length > 0;
}

/**
 * Type guard to check if candidate has valid content
 */
export function hasValidContent(candidate: GenerateContentCandidate): boolean {
  return candidate &&
         candidate.content &&
         candidate.content.parts &&
         Array.isArray(candidate.content.parts) &&
         candidate.content.parts.length > 0;
}

/**
 * Type guard for network errors
 */
export function isNetworkError(error: any): error is GeminiNetworkError {
  return error && error.type === 'NETWORK_ERROR';
}

/**
 * Type guard for schema validation errors
 */
export function isSchemaError(error: any): error is GeminiSchemaError {
  return error && error.type === 'SCHEMA_MISMATCH';
}

/**
 * Type guard for API errors
 */
export function isApiError(error: any): error is GeminiApiError {
  return error && typeof error.status === 'number' && typeof error.message === 'string';
}

/**
 * Extract text content from candidates with proper type safety
 */
export function extractTextFromCandidates(candidates: GenerateContentCandidate[]): string {
  if (!candidates || candidates.length === 0) {
    return '';
  }

  const firstCandidate = candidates[0];
  if (!hasValidContent(firstCandidate)) {
    return '';
  }

  const textParts = firstCandidate.content.parts
    .filter(part => part.text !== undefined)
    .map(part => part.text);

  return textParts.join('');
}

/**
 * Safe regex match with proper null handling
 */
export function safeRegexMatch(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match ? match[0] : null;
}

/**
 * Safe regex match with group extraction
 */
export function safeRegexMatchGroup(text: string, regex: RegExp, groupIndex: number = 1): string | null {
  const match = text.match(regex);
  return match && match[groupIndex] ? match[groupIndex] : null;
}