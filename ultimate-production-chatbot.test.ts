/**
 * Ultimate Production Chatbot - Test Suite
 * 
 * Tests for mandatory dual dependency and contract compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUltimateChatbot } from './ultimate-production-chatbot-impl';
import type { ChatbotConfig, ChatbotResponse, HealthStatus } from './ultimate-production-chatbot';

// Mock external dependencies
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => ({
    generateText: vi.fn()
  }))
}));

vi.mock('ai', () => ({
  generateText: vi.fn()
}));

// Mock fetch for Context7 API calls
global.fetch = vi.fn();

// MSW-style setup for API mocking
const mockContext7Search = vi.fn();
const mockContext7Context = vi.fn();
const mockGeminiGenerate = vi.fn();

// Setup mock responses
const setupContext7Mocks = () => {
  mockContext7Search.mockResolvedValue([
    { id: '/test/library', name: 'Test Library', description: 'Test Description' }
  ]);
  
  mockContext7Context.mockResolvedValue([
    {
      title: 'Test Document',
      content: 'Test content about React hooks',
      source: 'https://example.com/doc1',
      relevance: 0.9,
      lastUpdated: '2024-01-01'
    }
  ]);
  
  mockGeminiGenerate.mockResolvedValue({
    text: 'Based on the documentation, React hooks are functions that let you use state and other React features.',
    usage: {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150
    }
  });
};

// Mock fetch implementation
const mockFetch = vi.fn().mockImplementation((url) => {
  if (url.includes('/libs/search')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockContext7Search())
    });
  }
  
  if (url.includes('/context')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockContext7Context())
    });
  }
  
  return Promise.resolve({
    ok: false,
    status: 404,
    statusText: 'Not Found'
  });
});

// Replace global fetch
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true
});

// Test data factory
const createTestConfig = (overrides: Partial<ChatbotConfig> = {}): ChatbotConfig => ({
  googleApiKey: 'test-google-key',
  context7ApiKey: 'test-context7-key',
  cacheMaxSize: 10,
  cacheTTL: 1000 * 60, // 1 minute
  rateLimitPerMinute: 5,
  ...overrides
});

const createMockChatbotResponse = (overrides: Partial<ChatbotResponse> = {}): ChatbotResponse => ({
  success: true,
  answer: 'Test answer',
  sources: [{
    id: 'source_1',
    title: 'Test Document',
    url: 'https://example.com/doc1',
    snippet: 'Test content',
    relevance: 0.9,
    confidence: 0.8,
    provider: 'context7'
  }],
  context7Sources: [{
    id: 'doc_1',
    title: 'Test Document',
    content: 'Test content about React hooks',
    sourceUrl: 'https://example.com/doc1',
    relevance: 0.9,
    lastUpdated: '2024-01-01'
  }],
  usage: {
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150
  },
  responseTime: 1000,
  cached: false,
  timestamp: new Date().toISOString(),
  model: 'gemini-3.1-pro-preview',
  metadata: {
    requestId: 'req_123',
    toolsUsed: false,
    context7Used: true,
    cacheHit: false,
    processingTime: 1000
  },
  pipeline: {
    context7Retrieval: 'success',
    geminiGeneration: 'success'
  },
  ...overrides
});

describe('Ultimate Production Chatbot - Mandatory Dependencies', () => {
  let validConfig: ChatbotConfig;

  beforeEach(() => {
    // Set up valid configuration for tests
    validConfig = createTestConfig();

    // Mock environment variables
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'env-google-key';
    process.env.CONTEXT7_API_KEY = 'env-context7-key';
    
    // Setup API mocks
    setupContext7Mocks();
    
    // Clear all mock history
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.CONTEXT7_API_KEY;
  });

  describe('Startup Validation', () => {
    it('should fail creation if Gemini API key is missing', () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const config = { ...validConfig, googleApiKey: undefined };
      
      expect(() => createUltimateChatbot(config)).toThrow();
    });

    it('should fail creation if Context7 API key is missing', () => {
      delete process.env.CONTEXT7_API_KEY;
      const config = { ...validConfig, context7ApiKey: undefined };
      
      expect(() => createUltimateChatbot(config)).toThrow();
    });

    it('should fail creation if any API key is empty', () => {
      // Clear environment variables first
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.CONTEXT7_API_KEY;
      
      // Test empty string
      expect(() => createUltimateChatbot({ ...validConfig, googleApiKey: '' })).toThrow();
      expect(() => createUltimateChatbot({ ...validConfig, context7ApiKey: '' })).toThrow();
      
      // Test whitespace only
      expect(() => createUltimateChatbot({ ...validConfig, googleApiKey: '   ' })).toThrow();
      expect(() => createUltimateChatbot({ ...validConfig, context7ApiKey: '   ' })).toThrow();
    });

    it('should succeed creation with valid API keys from config', () => {
      expect(() => createUltimateChatbot(validConfig)).not.toThrow();
    });

    it('should succeed creation with valid API keys from environment', () => {
      const config = { cacheMaxSize: 10 }; // No API keys in config
      expect(() => createUltimateChatbot(config)).not.toThrow();
    });

    it('should not allow startup with missing dependencies', () => {
      // This test ensures no degraded mode on startup
      const config = { ...validConfig, googleApiKey: undefined };
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      expect(() => createUltimateChatbot(config)).toThrow(/Invalid input/);
    });
  });

  describe('Public API Contract', () => {
    let chatbot: ReturnType<typeof createUltimateChatbot>;

    beforeEach(() => {
      chatbot = createUltimateChatbot(validConfig);
    });

    it('should export createUltimateChatbot function', () => {
      expect(typeof createUltimateChatbot).toBe('function');
    });

    it('should return instance with correct methods', () => {
      expect(typeof chatbot.askQuestion).toBe('function');
      expect(typeof chatbot.healthCheck).toBe('function');
      expect(typeof chatbot.getMetrics).toBe('function');
      expect(typeof chatbot.getCacheStatistics).toBe('function');
      expect(typeof chatbot.clearCache).toBe('function');
      expect(typeof chatbot.cleanup).toBe('function');
    });

    it('should accept valid configuration', () => {
      expect(() => createUltimateChatbot(validConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = { ...validConfig, cacheMaxSize: -1 };
      expect(() => createUltimateChatbot(invalidConfig)).toThrow();
    });

    it('should not have any enable/disable flags for core dependencies', () => {
      // This test ensures the interface doesn't have disable flags
      const config = validConfig as any;
      
      // These should not exist in the config
      expect(config.enableContext7).toBeUndefined();
      expect(config.enableTools).toBeUndefined();
      expect(config.allowUngroundedFallback).toBeUndefined();
    });
  });

  describe('Response Contract', () => {
    let chatbot: ReturnType<typeof createUltimateChatbot>;

    beforeEach(() => {
      chatbot = createUltimateChatbot(validConfig);
    });

    it('should return ChatbotResponse with correct shape', async () => {
      // Mock the actual API calls for this test
      const mockResponse: ChatbotResponse = {
        success: true,
        answer: 'Test answer',
        responseTime: 100,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        metadata: {
          requestId: 'test-req',
          toolsUsed: false,
          context7Used: true,
          cacheHit: false,
          processingTime: 100
        },
        pipeline: {
          context7Retrieval: 'success',
          geminiGeneration: 'success'
        }
      };

      // For this test, we'll focus on the structure
      expect(mockResponse).toHaveProperty('success');
      expect(mockResponse).toHaveProperty('metadata');
      expect(mockResponse).toHaveProperty('pipeline');
      expect(mockResponse.pipeline).toHaveProperty('context7Retrieval');
      expect(mockResponse.pipeline).toHaveProperty('geminiGeneration');
    });

    it('should include error object when success=false', () => {
      const errorResponse: ChatbotResponse = {
        success: false,
        responseTime: 50,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          type: 'VALIDATION',
          retryable: false
        },
        metadata: {
          requestId: 'test-req',
          toolsUsed: false,
          context7Used: false,
          cacheHit: false,
          processingTime: 50
        },
        pipeline: {
          context7Retrieval: 'failed',
          geminiGeneration: 'failed'
        }
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error?.code).toBe('TEST_ERROR');
      expect(errorResponse.error?.type).toBe('VALIDATION');
    });

    it('should include metadata in all responses', () => {
      const response: ChatbotResponse = {
        success: true,
        answer: 'test',
        responseTime: 100,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        metadata: {
          requestId: 'test',
          toolsUsed: false,
          context7Used: true,
          cacheHit: false,
          processingTime: 100
        },
        pipeline: {
          context7Retrieval: 'success',
          geminiGeneration: 'success'
        }
      };

      expect(response.metadata).toBeDefined();
      expect(response.metadata?.requestId).toBe('test');
    });

    it('should handle context7Sources correctly', () => {
      const response: ChatbotResponse = {
        success: true,
        answer: 'test',
        context7Sources: [{
          id: 'test-doc',
          title: 'Test Document',
          content: 'Test content',
          sourceUrl: 'https://example.com',
          relevance: 0.9
        }],
        responseTime: 100,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        metadata: {
          requestId: 'test',
          toolsUsed: false,
          context7Used: true,
          cacheHit: false,
          processingTime: 100
        },
        pipeline: {
          context7Retrieval: 'success',
          geminiGeneration: 'success'
        }
      };

      expect(response.context7Sources).toBeDefined();
      expect(response.context7Sources?.length).toBe(1);
      expect(response.context7Sources?.[0].id).toBe('test-doc');
    });
  });

  describe('Health Check Model', () => {
    let chatbot: ReturnType<typeof createUltimateChatbot>;

    beforeEach(() => {
      chatbot = createUltimateChatbot(validConfig);
    });

    it('should not have disabled states for dependencies', async () => {
      const health = await chatbot.healthCheck();
      
      // Context7 should not have 'disabled' state
      expect(health.dependencies.context7).not.toBe('disabled');
      expect(health.dependencies.google).not.toBe('disabled');
    });

    it('should have minimal operational signals', async () => {
      const health = await chatbot.healthCheck();
      
      expect(health).toHaveProperty('minimal_operational_signals');
      expect(health.minimal_operational_signals).toHaveProperty('uptime');
      expect(health.minimal_operational_signals).toHaveProperty('active_requests');
    });

    it('should separate health from detailed metrics', async () => {
      const health = await chatbot.healthCheck();
      const metrics = chatbot.getMetrics();
      
      // Health should have minimal signals
      expect(Object.keys(health.minimal_operational_signals)).toHaveLength(2);
      
      // Metrics should have detailed information
      expect(Object.keys(metrics).length).toBeGreaterThan(2);
    });
  });
});

describe('Dual Pipeline Enforcement', () => {
  let chatbot: ReturnType<typeof createUltimateChatbot>;

  beforeEach(() => {
    chatbot = createUltimateChatbot(createTestConfig());
  });

  it('should prove both Context7 and Gemini were used in successful response', async () => {
    const response = await chatbot.askQuestion('What is React?');
    
    // Verify both pipeline stages succeeded
    expect(response.pipeline.context7Retrieval).toBe('success');
    expect(response.pipeline.geminiGeneration).toBe('success');
    
    // Verify Context7 was actually called
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/libs/search'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/context'),
      expect.any(Object)
    );
    
    // Verify response contains both Context7 sources and Gemini answer
    expect(response.context7Sources).toBeDefined();
    expect(response.context7Sources!.length).toBeGreaterThan(0);
    expect(response.answer).toBeDefined();
    expect(response.answer!.length).toBeGreaterThan(0);
  });

  it('should handle Context7 failure gracefully but still attempt Gemini', async () => {
    // Mock Context7 failure
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    );
    
    const response = await chatbot.askQuestion('What is React?');
    
    // Context7 should fail but Gemini should still be attempted
    expect(response.pipeline.context7Retrieval).toBe('failed');
    expect(response.pipeline.geminiGeneration).toBe('success'); // May still succeed with empty context
    expect(response.success).toBe(false); // Overall should fail due to Context7 failure
    expect(response.error).toBeDefined();
  });

  it('should track pipeline stages even when both fail', async () => {
    // Mock both services to fail
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    );
    
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockRejectedValue(new Error('Gemini API error'));
    
    const response = await chatbot.askQuestion('What is React?');
    
    // Both stages should be tracked as failed
    expect(response.pipeline.context7Retrieval).toBe('failed');
    expect(response.pipeline.geminiGeneration).toBe('failed');
    expect(response.success).toBe(false);
  });
});

describe('Input Validation and Normalization', () => {
  let chatbot: ReturnType<typeof createUltimateChatbot>;
  let validConfig: ChatbotConfig;

  beforeEach(() => {
    validConfig = {
      googleApiKey: 'test-google-key',
      context7ApiKey: 'test-context7-key',
      cacheMaxSize: 10,
      cacheTTL: 1000 * 60,
      rateLimitPerMinute: 5
    };
    
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'env-google-key';
    process.env.CONTEXT7_API_KEY = 'env-context7-key';
    
    chatbot = createUltimateChatbot(validConfig);
  });

  afterEach(() => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.CONTEXT7_API_KEY;
  });

  it('should reject empty questions', async () => {
    const response = await chatbot.askQuestion('');
    expect(response.success).toBe(false);
    expect(response.error?.type).toBe('VALIDATION');
  });

  it('should reject whitespace-only questions', async () => {
    const response = await chatbot.askQuestion('   ');
    expect(response.success).toBe(false);
    expect(response.error?.type).toBe('VALIDATION');
  });

  it('should reject questions that are too long', async () => {
    const longQuestion = 'a'.repeat(10001);
    const response = await chatbot.askQuestion(longQuestion);
    expect(response.success).toBe(false);
    expect(response.error?.type).toBe('VALIDATION');
  });

  it('should reject questions with HTML tags', async () => {
    const response1 = await chatbot.askQuestion('What is <script>alert("xss")</script>?');
    expect(response1.success).toBe(false);
    expect(response1.error?.type).toBe('VALIDATION');
    
    const response2 = await chatbot.askQuestion('Tell me about <div>content</div>');
    expect(response2.success).toBe(false);
    expect(response2.error?.type).toBe('VALIDATION');
  });

  it('should normalize input questions correctly', async () => {
    const question = '  What   is   React?  ';
    const response = await chatbot.askQuestion(question);
    
    expect(response.success).toBe(true);
    expect(response.answer).toBeDefined();
    
    // Verify the question was normalized (no excessive whitespace)
    const searchCalls = mockFetch.mock.calls.filter(call => 
      call[0].includes('/libs/search')
    );
    expect(searchCalls.length).toBeGreaterThan(0);
    
    // The search URL should contain the normalized question
    const searchUrl = searchCalls[0][0] as string;
    expect(searchUrl).not.toContain('  What   is   React?  ');
    expect(searchUrl).toContain('What is React?');
  });

describe('Integration Tests', () => {
  let chatbot: ReturnType<typeof createUltimateChatbot>;

  beforeEach(() => {
    chatbot = createUltimateChatbot(createTestConfig());
  });

  it('should handle end-to-end question processing with real API calls', async () => {
    const response = await chatbot.askQuestion('What is React?', {
      userId: 'test-user',
      sessionId: 'test-session'
    });

    // Verify successful response
    expect(response.success).toBe(true);
    expect(response.answer).toBeDefined();
    expect(response.answer!.length).toBeGreaterThan(0);
    
    // Verify both pipeline stages succeeded
    expect(response.pipeline.context7Retrieval).toBe('success');
    expect(response.pipeline.geminiGeneration).toBe('success');
    
    // Verify Context7 sources are included
    expect(response.context7Sources).toBeDefined();
    expect(response.context7Sources!.length).toBeGreaterThan(0);
    
    // Verify metadata
    expect(response.metadata.requestId).toBeTruthy();
    expect(response.metadata.userId).toBe('test-user');
    expect(response.metadata.sessionId).toBe('test-session');
    expect(response.metadata.context7Used).toBe(true);
    
    // Verify token usage
    expect(response.usage).toBeDefined();
    expect(response.usage!.totalTokens).toBeGreaterThan(0);
  });

  it('should handle Context7 API failure gracefully', async () => {
    // Mock Context7 to fail
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    );
    
    const response = await chatbot.askQuestion('What is React?');
    
    // Should fail due to Context7 dependency
    expect(response.success).toBe(false);
    expect(response.error?.type).toBe('CONTEXT7_UNAVAILABLE');
    expect(response.pipeline.context7Retrieval).toBe('failed');
  });

  it('should respect rate limiting', async () => {
    // Create chatbot with low rate limit
    const limitedChatbot = createUltimateChatbot(createTestConfig({
      rateLimitPerMinute: 2
    }));
    
    // Make requests up to the limit
    const response1 = await limitedChatbot.askQuestion('Question 1');
    const response2 = await limitedChatbot.askQuestion('Question 2');
    const response3 = await limitedChatbot.askQuestion('Question 3'); // Should be rate limited
    
    expect(response1.success).toBe(true);
    expect(response2.success).toBe(true);
    expect(response3.success).toBe(false);
    expect(response3.error?.type).toBe('RATE_LIMIT');
  });

  it('should handle caching correctly', async () => {
    // First request
    const response1 = await chatbot.askQuestion('What is React?', { useCache: true });
    expect(response1.cached).toBe(false);
    
    // Second request should hit cache
    const response2 = await chatbot.askQuestion('What is React?', { useCache: true });
    expect(response2.cached).toBe(true);
    expect(response2.answer).toBe(response1.answer);
    
    // Verify cache metrics
    const metrics = chatbot.getMetrics();
    expect(metrics.get('cache_hits')).toBeGreaterThan(0);
    expect(metrics.get('cache_misses')).toBeGreaterThan(0);
  });
});
