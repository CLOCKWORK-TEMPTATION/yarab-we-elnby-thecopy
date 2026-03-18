import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "النص قصير جداً للمراجعة" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح API غير متوفر" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `أنت خبير في كتابة السيناريوهات العربية. قم بمراجعة النص التالي وقدم ملاحظات على:
1. استمرارية الحبكة
2. تطور الشخصيات
3. قوة الحوار
4. التناقضات في النص

قدم اقتراحات محددة لتحسين النص مع الحفاظ على الأسلوب العربي الأصيل.

النص:
${text}`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        temperature: 0.9,
        maxOutputTokens: 48192,
      },
    });
    const review = result.text || "فشل في الحصول على المراجعة";

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error("Error reviewing screenplay:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء المراجعة" },
      { status: 500 }
    );
  }
}
