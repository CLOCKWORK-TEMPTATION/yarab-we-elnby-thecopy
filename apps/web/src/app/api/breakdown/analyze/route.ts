import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { script, analysisType = "full" } = await req.json();

    if (!script || script.trim().length === 0) {
      return NextResponse.json(
        { error: "Script content is required" },
        { status: 400 }
      );
    }

    // إذا كان هناك backend متصل
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      const response = await fetch(`${backendUrl}/api/breakdown/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") || "",
        },
        body: JSON.stringify({ script, analysisType }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // إذا لم يكن هناك backend، استخدم Gemini مباشرة
    const { analyzeScene } = await import("@/app/(main)/breakdown/services/geminiService");
    const result = await analyzeScene(script);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Error in breakdown analyze:", error);
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
