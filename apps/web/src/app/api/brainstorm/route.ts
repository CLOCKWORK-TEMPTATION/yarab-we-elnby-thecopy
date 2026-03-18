import { NextRequest, NextResponse } from "next/server";
import { multiAgentDebate } from "@/lib/drama-analyst/orchestration/multiAgentDebate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, context, agentIds } = body;

    if (!task || !agentIds || !Array.isArray(agentIds)) {
      return NextResponse.json(
        { error: "Missing required fields: task, agentIds" },
        { status: 400 }
      );
    }

    const debateResult = await multiAgentDebate.conductDebate(
      task,
      context || {},
      agentIds
    );

    return NextResponse.json({ success: true, result: debateResult });
  } catch (error) {
    console.error("[Brainstorm API] Error:", error);
    return NextResponse.json(
      { error: "Failed to conduct debate", details: String(error) },
      { status: 500 }
    );
  }
}
