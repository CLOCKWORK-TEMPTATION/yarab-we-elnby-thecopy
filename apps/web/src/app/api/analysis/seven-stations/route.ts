/**
 * DEPRECATED: This route is replaced by backend API
 * Redirect to: http://localhost:3001/api/analysis/seven-stations
 *
 * This file is kept for backward compatibility only.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Proxy to backend
    const response = await fetch(`${BACKEND_URL}/api/analysis/seven-stations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.statusText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Seven Stations proxy error:", error);
    return NextResponse.json(
      { error: "Failed to process analysis request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Seven Stations Analysis",
    status: "proxied to backend",
    backend: BACKEND_URL,
  });
}
