import { generateText, stepCountIs } from "ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { resolveLibraryId, queryDocs } from "@upstash/context7-tools-ai-sdk";

/**
 * Documentation-Aware Chatbot with Context7 Integration
 * Uses Gemini 3.1 Pro with documentation lookup capabilities
 */
export class DocumentationAwareChatbot {
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_GENAI_API_KEY environment variable is required');
    }
    
    this.model = new ChatGoogleGenerativeAI({
      modelName: "gemini-3.1-pro-preview",
      apiKey: apiKey,
    });
  }

  /**
   * Ask a question with automatic documentation lookup
   */
  async askQuestion(question: string) {
    const result = await generateText({
      model: this.model,
      prompt: question,
      tools: {
        resolveLibraryId: resolveLibraryId(),
        queryDocs: queryDocs(),
      },
      maxSteps: 5,
      system: `You are a helpful assistant with access to technical documentation.
      When answering questions about frameworks, libraries, or APIs, first use the documentation tools
      to find the most accurate and up-to-date information. Provide code examples when relevant.`,
    });

    return result;
  }

  /**
   * Specific method for Next.js authentication questions
   */
  async getNextAuthSetup() {
    return this.askQuestion("How do I set up authentication in Next.js 16.1.5?");
  }

  /**
   * Generic method for any documentation query
   */
  async queryDocumentation(query: string) {
    return this.askQuestion(query);
  }
}

// Usage example:
export async function testChatbot() {
  const chatbot = new DocumentationAwareChatbot();

  // Get Next.js authentication help
  const authHelp = await chatbot.getNextAuthSetup();

  // Query any documentation
  const customQuery = await chatbot.queryDocumentation("How to use React Server Components in Next.js 16?");
  
  return { authHelp, customQuery };
}