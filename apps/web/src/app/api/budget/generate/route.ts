import { NextRequest, NextResponse } from 'next/server';
// Import from BUDGET directory using path alias
import { geminiService } from '@/app/(main)/BUDGET/lib/geminiService';
import { INITIAL_BUDGET_TEMPLATE } from '@/app/(main)/BUDGET/lib/constants';

interface GenerateBudgetRequest {
  scenario: string;
  title?: string;
}

interface GenerateBudgetResponse {
  success: boolean;
  data?: { budget: unknown };
  error?: string;
}

function isValidContentType(contentType: string | null): boolean {
  return contentType === 'application/json' || contentType?.includes('application/json');
}

function createErrorResponse(message: string, status: number): NextResponse<GenerateBudgetResponse> {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateBudgetResponse>> {
  try {
    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!isValidContentType(contentType)) {
      return createErrorResponse('Content-Type must be application/json', 415);
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { scenario, title } = body as GenerateBudgetRequest;

    // Validate required fields
    if (!scenario || typeof scenario !== 'string' || scenario.trim() === '') {
      return createErrorResponse('Scenario/Script is required and must be a non-empty string', 400);
    }

    // Clone template and set title
    const template = JSON.parse(JSON.stringify(INITIAL_BUDGET_TEMPLATE));
    if (template.metadata) {
      template.metadata.title = title && typeof title === 'string' ? title : 'Untitled Project';
    }

    // Generate budget using Gemini Service
    const budget = await geminiService.generateBudgetFromScript(scenario, template);

    const response: GenerateBudgetResponse = {
      success: true,
      data: { budget }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate budget';
    console.error('Error in budget generation API:', error);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}
