import { NextRequest, NextResponse } from 'next/server';
// Import from BUDGET directory using path alias
import { geminiService } from '@/app/(main)/BUDGET/lib/geminiService';
import { INITIAL_BUDGET_TEMPLATE } from '@/app/(main)/BUDGET/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const { scenario, title } = await request.json();

        if (!scenario) {
            return NextResponse.json(
                { error: 'Scenario/Script is required' },
                { status: 400 }
            );
        }

        // Clone template and set title
        const template = JSON.parse(JSON.stringify(INITIAL_BUDGET_TEMPLATE));
        if (template.metadata) {
            template.metadata.title = title || 'Untitled Project';
        }

        // Generate budget using Gemini Service
        const budget = await geminiService.generateBudgetFromScript(scenario, template);

        return NextResponse.json({ budget });
    } catch (error: any) {
        console.error('Error in budget generation API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate budget' },
            { status: 500 }
        );
    }
}
