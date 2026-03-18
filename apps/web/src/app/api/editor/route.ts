import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, content, agentConfig, taskType } = body;

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ 
      model: agentConfig?.model || "gemini-1.5-flash" 
    });

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];

    if (action === "analyze") {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: content }] }],
        safetySettings,
        generationConfig: {
          temperature: agentConfig?.temperature || 0.7,
          maxOutputTokens: agentConfig?.maxOutputTokens || 8192,
        }
      });

      const response = result.response;
      const text = response.text();

      return NextResponse.json({ success: true, result: text });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Editor API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}
