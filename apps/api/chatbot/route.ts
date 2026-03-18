import { NextRequest, NextResponse } from 'next/server';
import { DocumentationAwareChatbot } from '../../../Documentation-Aware Chatbots';

const chatbot = new DocumentationAwareChatbot();

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const result = await chatbot.askQuestion(question);
    
    return NextResponse.json({
      answer: result.text,
      steps: result.steps,
      usage: result.usage
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await chatbot.getNextAuthSetup();
    return NextResponse.json({
      answer: result.text,
      steps: result.steps
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to get authentication help' },
      { status: 500 }
    );
  }
}
