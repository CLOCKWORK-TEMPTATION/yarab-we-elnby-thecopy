import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/ai/gemini-service";

/**
 * POST /api/cineai/color-grading
 * Suggest color grading palette based on scene type
 */
export async function POST(request: NextRequest) {
  try {
    const { sceneType, mood, temperature } = await request.json();

    if (!sceneType) {
      return NextResponse.json(
        { error: "Scene type is required" },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No Gemini API key found, using fallback mock data");
      return generateMockPalette(sceneType, mood, temperature);
    }

    // Initialize Gemini service
    const geminiService = new GeminiService(apiKey);

    // Generate color palette using AI
    const systemInstruction = `أنت خبير في التدريج اللوني السينمائي (Color Grading) والإضاءة. قم بتحليل نوع المشهد المقدم واقترح لوحة ألوان احترافية.

You are an expert in cinematic color grading and lighting. Analyze the provided scene type and suggest a professional color palette.

Return the response as a JSON object with the following structure:
{
  "palette": ["#HEXCODE1", "#HEXCODE2", "#HEXCODE3", "#HEXCODE4", "#HEXCODE5"],
  "primaryColor": "#HEXCODE",
  "secondaryColor": "#HEXCODE",
  "accentColor": "#HEXCODE",
  "suggestions": ["suggestion 1 in Arabic", "suggestion 2 in Arabic", "suggestion 3 in Arabic"],
  "lutRecommendation": "brief recommendation for LUT settings",
  "cinematicReferences": ["film/show reference 1", "film/show reference 2"]
}

Provide 5 harmonious colors that work well together for the specified scene.`;

    const moodInfo = mood ? ` with ${mood} mood` : "";
    const tempInfo = temperature ? ` (color temperature: ${temperature}K)` : "";

    const prompt = `${systemInstruction}

نوع المشهد / Scene Type: ${sceneType}${moodInfo}${tempInfo}

قم بإنشاء لوحة ألوان احترافية للتدريج اللوني لهذا النوع من المشاهد، مع اقتراحات عملية للتطبيق.
Generate a professional color grading palette for this scene type, with practical suggestions for implementation.`;

    const model = geminiService.getModel("gemini-1.5-flash", "analysis");
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the AI response
    let aiData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, fallback to mock data
        console.warn("Could not parse AI response, using fallback");
        return generateMockPalette(sceneType, mood, temperature);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return generateMockPalette(sceneType, mood, temperature);
    }

    return NextResponse.json({
      success: true,
      palette: aiData.palette || [],
      primaryColor: aiData.primaryColor,
      secondaryColor: aiData.secondaryColor,
      accentColor: aiData.accentColor,
      sceneType,
      mood: mood || "neutral",
      temperature: temperature || 5500,
      suggestions: aiData.suggestions || [],
      lutRecommendation: aiData.lutRecommendation,
      cinematicReferences: aiData.cinematicReferences || [],
      generatedAt: new Date().toISOString(),
      source: "ai",
    });
  } catch (error) {
    console.error("Error generating color palette:", error);
    return NextResponse.json(
      { error: "Failed to generate color palette" },
      { status: 500 }
    );
  }
}

/**
 * Fallback function to generate mock palette when AI is unavailable
 */
function generateMockPalette(
  sceneType: string,
  mood?: string,
  temperature?: number
) {
  const palettes: Record<string, string[]> = {
    morning: ["#FFE5B4", "#FFD700", "#FFA500", "#FF8C00", "#E67E22"],
    night: ["#0F1624", "#1a2332", "#2c3e50", "#34495e", "#4a5c7a"],
    indoor: ["#8B7355", "#A0826D", "#C19A6B", "#D4A574", "#E8C89c"],
    outdoor: ["#87CEEB", "#6CA6CD", "#4682B4", "#5F9EA0", "#708090"],
    happy: ["#FFD700", "#FFA500", "#FF6B6B", "#FFC0CB", "#FFE4E1"],
    sad: ["#2C3E50", "#34495E", "#7F8C8D", "#95A5A6", "#BDC3C7"],
  };

  const selectedPalette =
    palettes[sceneType.toLowerCase()] || palettes.indoor || [];

  return NextResponse.json({
    success: true,
    palette: selectedPalette,
    primaryColor: selectedPalette[0] || "#000000",
    secondaryColor: selectedPalette[2] || "#000000",
    accentColor: selectedPalette[4] || "#000000",
    sceneType,
    mood: mood || "neutral",
    temperature: temperature || 5500,
    suggestions: [
      "استخدم هذه الألوان كنقطة بداية للـ LUT",
      "قم بتعديل درجة الحرارة حسب وقت اليوم",
      "تأكد من التناسق عبر كل المشاهد",
    ],
    lutRecommendation: "استخدم LUT دافئ للمشاهد النهارية وبارد للمشاهد الليلية",
    cinematicReferences: [],
    generatedAt: new Date().toISOString(),
    source: "mock",
  });
}
