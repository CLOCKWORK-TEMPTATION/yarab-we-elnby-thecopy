/**
 * DEPRECATED: This route is replaced by backend API
 * Redirect to: http://localhost:3001/api/ai/chat
 *
 * This file is kept for backward compatibility only.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.statusText}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
