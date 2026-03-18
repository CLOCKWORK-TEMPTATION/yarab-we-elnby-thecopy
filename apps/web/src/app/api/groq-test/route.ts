import { Groq } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: "Hello from Vercel!" }
      ]
    });
    
    return NextResponse.json({ 
      message: response.choices[0].message.content 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}