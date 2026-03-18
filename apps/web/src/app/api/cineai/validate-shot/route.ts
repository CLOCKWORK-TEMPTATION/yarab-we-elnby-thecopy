import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * POST /api/cineai/validate-shot
 * Validate shot quality and provide feedback using AI vision
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Check for API key
    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No Gemini API key found, using fallback mock data");
      return generateMockValidation();
    }

    // Convert image to buffer
    let imageBuffer: Buffer;
    let mimeType: string;

    if (image instanceof File) {
      const arrayBuffer = await image.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = image.type;
    } else {
      console.warn("Invalid image format, using fallback mock data");
      return generateMockValidation();
    }

    // Initialize Gemini with vision capabilities
    const genAI = new GoogleGenAI({ apiKey });

    // Prepare the vision prompt
    const prompt = `أنت خبير في التصوير السينمائي والإضاءة. قم بتحليل هذه الصورة/اللقطة وتقييمها من الناحية الفنية.

You are an expert in cinematography and lighting. Analyze this image/shot and evaluate it technically.

قم بتقييم العناصر التالية وأعطِ درجة إجمالية من 100:
Evaluate the following elements and give an overall score out of 100:

1. **Exposure (التعريض)**: هل الإضاءة مناسبة؟ هل هناك مناطق محروقة أو معتمة؟
2. **Composition (التكوين)**: هل اتباع قواعد التكوين؟ القاعدة الثلثية، Leading lines، التوازن؟
3. **Focus (الفوكس)**: هل الفوكس حاد على الموضوع الرئيسي؟
4. **Color Balance (توازن الألوان)**: هل الألوان متوازنة؟ درجة الحرارة اللونية مناسبة؟
5. **Technical Quality**: جودة الصورة، الـnoise، الـsharpness

Return your analysis as a JSON object with the following structure:
{
  "score": number (0-100),
  "status": "excellent" | "good" | "acceptable" | "needs_improvement",
  "exposure": "Excellent" | "Good" | "Acceptable" | "Poor",
  "composition": "Excellent" | "Good" | "Acceptable" | "Poor",
  "focus": "Excellent" | "Good" | "Acceptable" | "Poor",
  "colorBalance": "Excellent" | "Good" | "Acceptable" | "Poor",
  "suggestions": ["suggestion 1 in Arabic", "suggestion 2 in Arabic", "suggestion 3 in Arabic"],
  "technicalDetails": {
    "histogram": "description",
    "waveform": "description",
    "vectorscope": "description"
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"]
}`;

    // Call Gemini vision API
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const responseText = result.text || "";

    // Parse the AI response
    let validation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("Could not parse AI response, using fallback");
        return generateMockValidation();
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return generateMockValidation();
    }

    return NextResponse.json({
      success: true,
      validation,
      analyzedAt: new Date().toISOString(),
      source: "ai",
    });
  } catch (error) {
    console.error("Error validating shot:", error);
    return NextResponse.json(
      { error: "Failed to validate shot" },
      { status: 500 }
    );
  }
}

/**
 * Fallback function to generate mock validation when AI is unavailable
 */
function generateMockValidation() {
  const mockValidation = {
    score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
    status: "good",
    exposure: "Good",
    composition: "Excellent",
    focus: "Acceptable",
    colorBalance: "Good",
    suggestions: [
      "الإضاءة جيدة ولكن يمكن تحسين الـ fill light قليلاً",
      "الإطار مكون بشكل ممتاز - القاعدة الثلثية مطبقة",
      "تأكد من ضبط الفوكس على عيني الممثل",
      "Color temperature متسق مع المشاهد السابقة",
    ],
    technicalDetails: {
      histogram: "Balanced",
      waveform: "Good dynamic range",
      vectorscope: "Colors within broadcast safe",
    },
    strengths: [],
    improvements: [],
  };

  return NextResponse.json({
    success: true,
    validation: mockValidation,
    analyzedAt: new Date().toISOString(),
    source: "mock",
  });
}
