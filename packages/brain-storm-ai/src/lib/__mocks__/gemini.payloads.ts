/**
 * @file Mock payloads for Gemini API testing
 * Provides representative response data for success, error, and schema mismatch scenarios
 */

import type { GenerateContentCandidate, FinishReason, HarmCategory, HarmProbability } from "@google/generative-ai";
import type { GeminiSuccessResponse, GeminiApiError, GeminiNetworkError, GeminiSchemaError } from '../geminiTypes';

/**
 * Mock successful response with text content
 */
export const mockSuccessTextResponse: GeminiSuccessResponse = {
  candidates: [
    {
      content: {
        parts: [
          { text: "هذا نص تجريبي باللغة العربية للاختبار" }
        ],
        role: "model"
      },
      finishReason: "STOP" as FinishReason,
      index: 0,
      safetyRatings: [
        {
          category: "HARM_CATEGORY_HARASSMENT" as HarmCategory,
          probability: "NEGLIGIBLE" as HarmProbability
        }
      ]
    }
  ]
};

/**
 * Mock successful response with JSON content
 */
export const mockSuccessJsonResponse: GeminiSuccessResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: `\`\`\`json
{
  "analysis": {
    "characters": ["محمد", "فاطمة"],
    "themes": ["العائلة", "الصداقة"],
    "tone": "دراما اجتماعية"
  },
  "score": 85
}
\`\`\``
          }
        ],
        role: "model"
      },
      finishReason: "STOP" as FinishReason,
      index: 0
    }
  ]
};

/**
 * Mock API error response (400 - Bad Request)
 */
export const mockApiError400: GeminiApiError = {
  status: 400,
  message: "Invalid request: The request body is malformed",
  code: "INVALID_ARGUMENT",
  details: [
    {
      "@type": "type.googleapis.com/google.rpc.BadRequest",
      reason: "INVALID_CONTENT",
      domain: "googleapis.com"
    }
  ]
};

/**
 * Mock API error response (401 - Unauthorized)
 */
export const mockApiError401: GeminiApiError = {
  status: 401,
  message: "API key not valid. Please check your API key",
  code: "UNAUTHENTICATED"
};

/**
 * Mock API error response (429 - Rate Limit)
 */
export const mockApiError429: GeminiApiError = {
  status: 429,
  message: "Rate limit exceeded. Please try again later",
  code: "RESOURCE_EXHAUSTED"
};

/**
 * Mock API error response (500 - Internal Server Error)
 */
export const mockApiError500: GeminiApiError = {
  status: 500,
  message: "Internal server error occurred",
  code: "INTERNAL"
};

/**
 * Mock network error
 */
export const mockNetworkError: GeminiNetworkError = {
  type: 'NETWORK_ERROR',
  message: 'Network request failed: timeout after 30000ms',
  originalError: new Error('ECONNRESET')
};

/**
 * Mock schema mismatch error
 */
export const mockSchemaError: GeminiSchemaError = {
  type: 'SCHEMA_MISMATCH',
  message: 'Response does not match expected JSON schema',
  expectedSchema: 'AnalysisResult',
  receivedData: { unexpected: 'data', format: true }
};

/**
 * Mock response with content blocked by safety filters
 */
export const mockBlockedContentResponse: GeminiSuccessResponse = {
  candidates: [
    {
      content: {
        parts: [],
        role: "model"
      },
      finishReason: "SAFETY" as FinishReason,
      index: 0,
      safetyRatings: [
        {
          category: "HARM_CATEGORY_HARASSMENT" as HarmCategory,
          probability: "HIGH" as HarmProbability
        }
      ]
    }
  ]
};

/**
 * Mock response with empty candidates
 */
export const mockEmptyCandidatesResponse = {
  candidates: []
};

/**
 * Mock response with malformed JSON in text
 */
export const mockMalformedJsonResponse: GeminiSuccessResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: `\`\`\`json
{
  "analysis": {
    "characters": ["محمد", "فاطمة",
    "themes": ["العائلة", "الصداقة"]
    "score": 85
}
\`\`\``
          }
        ],
        role: "model"
      },
      finishReason: "STOP" as FinishReason,
      index: 0
    }
  ]
};

/**
 * Helper function to create mock responses for testing
 */
export const mockResponseFactory = {
  success: (text: string) => ({
    candidates: [
      {
        content: {
          parts: [{ text }],
          role: "model" as const
        },
        finishReason: "STOP" as FinishReason,
        index: 0
      }
    ]
  }),

  apiError: (status: number, message: string, code?: string) => ({
    status,
    message,
    ...(code && { code })
  }),

  networkError: (message: string) => ({
    type: 'NETWORK_ERROR' as const,
    message,
    originalError: new Error(message)
  })
};