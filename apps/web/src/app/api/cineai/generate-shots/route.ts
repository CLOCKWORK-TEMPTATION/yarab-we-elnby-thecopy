/**
 * DEPRECATED: This route is replaced by backend API
 * Redirect to: http://localhost:3001/api/shots/suggestion
 *
 * This file is kept for backward compatibility only.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/shots/suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.statusText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Shot generation proxy error:", error);
    return NextResponse.json(
      { error: "Failed to generate shot list" },
      { status: 500 }
    );
  }
}
