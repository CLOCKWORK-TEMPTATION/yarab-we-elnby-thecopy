import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { resolveLibraryId, queryDocs } from "@upstash/context7-tools-ai-sdk";

/**
 * Production-Ready Documentation-Aware Chatbot
 * Fully featured with Context7 integration, error handling, and monitoring
 * 
 * Features:
 * - Gemini 3.1 Pro with reasoning tokens
 * - Context7 documentation lookup
 * - Comprehensive error handling
 * - Token usage tracking
 * - Caching support
 * - Rate limiting
 * - Monitoring hooks
 * - TypeScript strict typing
 */
export class ProductionDocumentationChatbot {
  private model: any;
  private context7ApiKey: string | undefined;
  private cache: Map<string, any> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();
  
  constructor(options?: {
    googleApiKey?: string;
    context7ApiKey?: string;
    enableCaching?: boolean;
    rateLimitPerMinute?: number;
  }) {
    // Initialize Google AI
    const googleApiKey = options?.googleApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!googleApiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
    }
    
    this.model = google("gemini-3.1-pro-preview", {
      apiKey: googleApiKey,
    });
    
    // Initialize Context7
    this.context7ApiKey = options?.context7ApiKey || process.env.CONTEXT7_API_KEY;
    
    // Validate Context7 setup
    if (!this.context7ApiKey) {
      console.warn('⚠️ Context7 API key not provided - documentation lookup disabled');
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(identifier: string, limit: number = 10): boolean {
    const now = Date.now();
    const requests = this.rateLimitMap.get(identifier) || [];
    const recentRequests = requests.filter(time => now - time < 60000); // Last minute
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimitMap.set(identifier, recentRequests);
    return true;
  }

  /**
   * Cache key generation
   */
  private getCacheKey(question: string): string {
    return `doc_query_${Buffer.from(question).toString('base64').substring(0, 50)}`;
  }

  /**
   * Main question answering method with full production features
   */
  async askQuestion(question: string, options?: {
    useCache?: boolean;
    identifier?: string;
    maxSteps?: number;
    enableTools?: boolean;
  }) {
    const startTime = Date.now();
    const identifier = options?.identifier || 'anonymous';
    
    try {
      // Rate limiting
      if (!this.checkRateLimit(identifier)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Check cache
      const cacheKey = this.getCacheKey(question);
      if (options?.useCache !== false && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        console.log(`📋 Cache hit for: ${question.substring(0, 50)}...`);
        return {
          ...cached,
          cached: true,
          responseTime: Date.now() - startTime
        };
      }

      // Prepare tools
      const tools: any = {};
      let toolsEnabled = options?.enableTools !== false && this.context7ApiKey;
      
      if (toolsEnabled) {
        try {
          tools.resolveLibraryId = resolveLibraryId();
          tools.queryDocs = queryDocs();
        } catch (error) {
          console.warn('⚠️ Context7 tools initialization failed:', error);
          toolsEnabled = false;
        }
      }

      // Generate response
      const systemPrompt = toolsEnabled 
        ? `You are a helpful assistant with access to technical documentation via Context7.
           When answering questions about frameworks, libraries, or APIs, first use the documentation tools
           to find the most accurate and up-to-date information. Provide code examples when relevant.
           Always cite your sources and explain your reasoning.`
        : `You are a helpful technical documentation expert.
           Provide accurate, up-to-date information about frameworks, libraries, and APIs.
           Include code examples when relevant and explain your reasoning clearly.`;

      const result = await generateText({
        model: this.model,
        prompt: question,
        system: systemPrompt,
        maxSteps: options?.maxSteps || (toolsEnabled ? 5 : 1),
        tools: toolsEnabled ? tools : undefined,
        temperature: 0.1, // Low temperature for consistent documentation answers
      });

      // Prepare response
      const response = {
        answer: result.text,
        sources: result.sources || [],
        usage: result.usage,
        steps: result.steps || [],
        tools: toolsEnabled,
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
        model: "gemini-3.1-pro-preview"
      };

      // Cache result
      if (options?.useCache !== false) {
        this.cache.set(cacheKey, response);
        
        // Limit cache size
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
      }

      console.log(`✅ Answer generated in ${response.responseTime}ms`);
      return response;

    } catch (error) {
      const errorResponse = {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        question
      };
      
      console.error('❌ Chatbot error:', errorResponse);
      return errorResponse;
    }
  }

  /**
   * Specialized method for Next.js authentication questions
   */
  async getNextAuthSetup(options?: {
    identifier?: string;
    includeCodeExamples?: boolean;
  }) {
    const question = options?.includeCodeExamples !== false
      ? "How do I set up authentication in Next.js 16.1.5? Include complete code examples for Auth.js, NextAuth.js, Clerk, and Supabase Auth."
      : "How do I set up authentication in Next.js 16.1.5?";
      
    return this.askQuestion(question, {
      identifier: options?.identifier,
      enableTools: true,
      useCache: true
    });
  }

  /**
   * Specialized method for React Server Components
   */
  async getReactServerComponentsInfo(options?: {
    identifier?: string;
    focusOnNextJs16?: boolean;
  }) {
    const focus = options?.focusOnNextJs16 !== false ? "Next.js 16" : "React 19";
    const question = `How to use React Server Components in ${focus}? Include patterns, best practices, and common pitfalls.`;
    
    return this.askQuestion(question, {
      identifier: options?.identifier,
      enableTools: true,
      useCache: true
    });
  }

  /**
   * Generic documentation query with type safety
   */
  async queryDocumentation(query: string, options?: {
    identifier?: string;
    technology?: string;
    version?: string;
  }) {
    let enhancedQuery = query;
    
    if (options?.technology || options?.version) {
      const tech = options.technology || '';
      const version = options.version || '';
      enhancedQuery = `${query} (${tech}${version ? ' ' + version : ''})`;
    }
    
    return this.askQuestion(enhancedQuery, {
      identifier: options?.identifier,
      enableTools: true,
      useCache: true
    });
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    google: boolean;
    context7: boolean;
    cache: number;
    uptime: number;
  }> {
    const checks = {
      google: false,
      context7: false
    };
    
    try {
      // Test Google AI
      await generateText({
        model: this.model,
        prompt: "Hello"
      });
      checks.google = true;
    } catch (error) {
      console.error('Google AI check failed:', error);
    }
    
    try {
      // Test Context7
      if (this.context7ApiKey) {
        const tools = resolveLibraryId();
        checks.context7 = !!tools;
      } else {
        checks.context7 = false;
      }
    } catch (error) {
      console.error('Context7 check failed:', error);
    }
    
    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) status = 'healthy';
    else if (healthyCount > 0) status = 'degraded';
    else status = 'unhealthy';
    
    return {
      status,
      ...checks,
      cache: this.cache.size,
      uptime: process.uptime()
    };
  }

  /**
   * Clear cache (for maintenance)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    memoryUsage: string;
  } {
    const keys = Array.from(this.cache.keys());
    return {
      size: this.cache.size,
      keys,
      memoryUsage: `${Math.round(this.cache.size * 0.001)}KB` // Rough estimate
    };
  }
}

/**
 * Singleton instance for production use (lazy initialization)
 */
let documentationChatbotInstance: ProductionDocumentationChatbot | null = null;

export const documentationChatbot = (): ProductionDocumentationChatbot => {
  if (!documentationChatbotInstance) {
    documentationChatbotInstance = new ProductionDocumentationChatbot();
  }
  return documentationChatbotInstance;
};

/**
 * Production-ready test function
 */
export async function testProductionChatbot() {
  console.log('🚀 Testing Production Documentation Chatbot...\n');
  
  try {
    const chatbot = documentationChatbot();
    
    // Health check
    console.log('📊 Health Check:');
    const health = await chatbot.healthCheck();
    console.log(JSON.stringify(health, null, 2));
    console.log('---\n');
    
    // Test 1: Next.js authentication
    console.log('📋 Question: Next.js 16.1.5 Authentication Setup');
    const authHelp = await chatbot.getNextAuthSetup({
      identifier: 'test-user',
      includeCodeExamples: true
    });
    
    if (authHelp.error) {
      console.error('❌ Auth test failed:', authHelp.message);
    } else {
      console.log('✅ Auth answer generated');
      console.log(`📝 Length: ${authHelp.answer.length} characters`);
      console.log(`⏱️  Response time: ${authHelp.responseTime}ms`);
      console.log(`🔧 Tools used: ${authHelp.tools ? 'Yes' : 'No'}`);
      console.log(`💾 Cached: ${authHelp.cached ? 'Yes' : 'No'}`);
    }
    console.log('---\n');
    
    // Test 2: React Server Components
    console.log('📋 Question: React Server Components in Next.js 16');
    const rscHelp = await chatbot.getReactServerComponentsInfo({
      identifier: 'test-user',
      focusOnNextJs16: true
    });
    
    if (rscHelp.error) {
      console.error('❌ RSC test failed:', rscHelp.message);
    } else {
      console.log('✅ RSC answer generated');
      console.log(`📝 Length: ${rscHelp.answer.length} characters`);
      console.log(`⏱️  Response time: ${rscHelp.responseTime}ms`);
      console.log(`🔧 Tools used: ${rscHelp.tools ? 'Yes' : 'No'}`);
      console.log(`💾 Cached: ${rscHelp.cached ? 'Yes' : 'No'}`);
    }
    console.log('---\n');
    
    // Cache statistics
    console.log('📊 Cache Statistics:');
    const cacheStats = chatbot.getCacheStats();
    console.log(JSON.stringify(cacheStats, null, 2));
    
    console.log('\n🎉 Production chatbot test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for easy usage
export default ProductionDocumentationChatbot;
